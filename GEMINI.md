# Subagent Orchestration Rules

When invoking subagents (`invoke_subagent`), you MUST adhere to the following best practices to prevent the main agent from hanging indefinitely:

1. **Explicit Communication:** In the subagent's `Prompt`, you must explicitly instruct it to use the `send_message` tool to report back to you when finished. 
   - *Example:* "When you are done, use the send_message tool to send your final report back to me."
   - Do not use vague language like "report back", as the subagent will default to outputting text to the user instead of sending a message.

2. **Timeout Safeguard:** Immediately after invoking a subagent (or group of subagents), you must use the `schedule` tool to set a timeout for how long you are willing to wait for a response.
   - Set `TimerCondition="any"` if you are waiting for multiple subagents, or `TimerCondition="<sender-id>"` for a specific subagent.
   - This ensures that if a subagent gets stuck, fails, or forgets to send a message, you will be woken up by the timer to check on their progress and intervene.
