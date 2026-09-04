import { db } from '@movejs/data';

export async function GET(req: any) {
  try {
    // Using the built-in ORM
    const users = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return Response.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: any) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return Response.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 });
    }

    // Create user with ORM
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email
      }
    });

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
