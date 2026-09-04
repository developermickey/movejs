// MoveJS website - demo API route referenced in the docs

export function GET(request: Request) {
  return Response.json({
    message: 'Hello from MoveJS',
    time: new Date().toISOString()
  });
}