import { FathomClient } from './FathomClient';

// message sent to the queue
type VoteMessage = {
  article_external_id: string;
  support?: boolean;
  oppose?: boolean;
};

type ArticleExternalId = string;

// groups all of the messages by article ID
// support/oppose are added to the cached article's votes
type VotesByArticleId = {
  [key: ArticleExternalId]: {
    support: number;
    oppose: number;
  };
};

// the actual cached article, we only care about the `votes` key
type CachedArticle = {
  article: any;
  votes: {
    support: number;
    oppose: number;
  };
};

type SiteStats = {
  total_votes: number;
  daily_readers: number;
};

export default {
  async queue(batch: MessageBatch<VoteMessage>, env: Env) {
    const votes_by_article_id: VotesByArticleId = {};
    let new_votes = 0;

    for (const message of batch.messages) {
      const article_external_id = message.body.article_external_id;

      if (!votes_by_article_id[article_external_id])
        votes_by_article_id[article_external_id] = { support: 0, oppose: 0 };

      if (message.body.support) {
        votes_by_article_id[article_external_id].support += 1;
        new_votes += 1;
      }

      if (message.body.oppose) {
        votes_by_article_id[article_external_id].oppose += 1;
        new_votes += 1;
      }
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

    // add the new votes to the total
    const stats = await env.ARTICLES.get<SiteStats>('stats', 'json');

    if (!stats) {
      await env.ARTICLES.put(
        'stats',
        JSON.stringify({
          daily_readers: 0,
          total_votes: new_votes,
        } as SiteStats),
      );
    } else {
      stats.total_votes += new_votes;

      await env.ARTICLES.put('stats', JSON.stringify(stats));
    }
  },

  async scheduled(controller: ScheduledController, env: Env) {
    const daily_readers = await FathomClient.getDailyReaders(env);

    const stats = await env.ARTICLES.get<SiteStats>('stats', 'json');

    if (!stats) {
      await env.ARTICLES.put(
        'stats',
        JSON.stringify({
          daily_readers,
          total_votes: 0,
        } as SiteStats),
      );
    } else {
      stats.daily_readers = daily_readers;
      await env.ARTICLES.put('stats', JSON.stringify(stats));
    }
  },
} satisfies ExportedHandler<Env, VoteMessage>;
