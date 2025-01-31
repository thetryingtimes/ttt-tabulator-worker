type VoteMessage = {
  article_external_id: string;
  support?: boolean;
  oppose?: boolean;
};

type VotesByArticleId = {
  [key: string]: {
    support: number;
    oppose: number;
  };
};

type CachedArticle = {
  article: any;
  votes: {
    support: number;
    oppose: number;
  };
};

export default {
  async queue(batch: MessageBatch<VoteMessage>, env: Env) {
    const votes_by_article_id: VotesByArticleId = {};

    for (const message of batch.messages) {
      const article_external_id = message.body.article_external_id;

      if (!votes_by_article_id[article_external_id])
        votes_by_article_id[article_external_id] = { support: 0, oppose: 0 };

      if (message.body.support)
        votes_by_article_id[article_external_id].support += 1;

      if (message.body.oppose)
        votes_by_article_id[article_external_id].oppose += 1;
    }

    for (const article_external_id of Object.keys(votes_by_article_id)) {
      const key = `article:${article_external_id}`;
      const cached_article = await env.ARTICLES.get<CachedArticle>(key, 'json');

      if (cached_article) {
        cached_article.votes.support +=
          votes_by_article_id[article_external_id].support;
        cached_article.votes.oppose +=
          votes_by_article_id[article_external_id].oppose;

        await env.ARTICLES.put(key, JSON.stringify(cached_article));
      }
    }
  },
} satisfies ExportedHandler<Env, VoteMessage>;
