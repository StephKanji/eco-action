import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {Navbar} from '@/components/navbar'

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}): Promise<React.ReactElement> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return (
        <div className="min-h-screen bg-white">
            <Navbar/>
            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    );
}