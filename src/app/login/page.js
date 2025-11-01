'use client';
import Link from "next/link";
import { useState } from "react";
import { Button }   from "../../components/ui/button";
import { Input }    from "../../components/ui/input";
import { addDoc} from "firebase/firestore";

import { Checkbox } from "../../components/ui/checkbox";

// export const metadata = {
//   title: "Login | rialytics",
//   description: "Log in to your rialytics account",
// };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);
    // You can now send this data to your backend or Firestore
  };

  return (
    <main className="flex-1">
      <div className="flex h-screen flex-col items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-white p-6 shadow-sm"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Enter your credentials</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">Log In</Button>
        </form>
      </div>
    </main>
  );
}
