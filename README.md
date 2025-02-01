# The Trying Times - Vote Tabulator

This worker listens to messages sent to a queue, and updates a KV cache with a new sum of votes. This is not responsible for verifying the integrity of a ballot, that happens at vote-time.
