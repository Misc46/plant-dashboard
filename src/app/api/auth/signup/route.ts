import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";


const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "VIEWER"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;

    // Create auth user via Firebase Admin
    const userRecord = await adminAuth.createUser({
      email,
      password,
    });

    // Write role record to firestore users/{uid}
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      role,
      createdAt: FieldValue.serverTimestamp(),
    });


    return NextResponse.json(
      { message: "User created successfully", uid: userRecord.uid, role },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup endpoint error:", error);
    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

