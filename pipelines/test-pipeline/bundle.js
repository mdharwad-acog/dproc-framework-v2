export default async function createBundle(inputs) {
  return {
    topic: inputs.topic,
    timestamp: new Date().toISOString(),
    data: {},
  };
}
