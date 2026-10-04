/** Translates a host's hook payload into the canonical shape the guard decides on. */
export function normalizeInput(input, adapter = {}) {
  const identity = adapter.identity ?? { id: 'agent_id', type: 'agent_type' };
  const tool = input.tool_name;
  return {
    ...input,
    tool_name: adapter.tool_aliases?.[tool] ?? tool,
    agent_id: input[identity.id],
    agent_type: input[identity.type],
  };
}
