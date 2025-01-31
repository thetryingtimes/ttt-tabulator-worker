import { getTodaysDate } from './utils/date';
import { z } from 'zod';

const FathomResponseParser = z.array(
  z.object({
    visits: z.string(),
  }),
);

export class FathomClient {
  static async getDailyReaders(env: Env) {
    const req = await fetch(
      `https://api.usefathom.com/v1/aggregations?entity=pageview&entity_id=${env.FATHOM_ENTITY_ID}&aggregates=visits&date_grouping=day&date_from=${getTodaysDate()}&field_grouping=hostname`,
      {
        headers: {
          Authorization: `Bearer ${env.FATHOM_API_TOKEN}`,
        },
      },
    );

    const res = await req.json();
    const parsed = FathomResponseParser.safeParse(res);
    let count = 0;

    if (parsed.success) {
      parsed.data.forEach((entry) => {
        count += Number(entry.visits);
      });
    }

    return count;
  }
}
