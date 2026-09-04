// In-memory user store for the example (swap for the MoveJS ORM once a DB is configured)
const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@movejs.dev' },
  { id: 2, name: 'Alan Turing', email: 'alan@movejs.dev' }
];

export async function GET() {
  return Response.json({
    success: true,
    data: users,
    count: users.length
  });
}

export async function POST(req: any) {
  try {
    const body = await req.json();

    if (!body.name || !body.email) {
      return Response.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 });
    }

    const user = { id: users.length + 1, name: body.name, email: body.email };
    users.push(user);

    return Response.json({
      success: true,
      data: user
    }, { status: 201 });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
