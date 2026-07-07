import Loading from "./_loading/loading";
import { Navigate } from "react-router";
import { authClient } from "@/lib/auth";

export default function Home() {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) {
        return <Loading />;
    }

    if (!session && !isPending) {
        return <Navigate to="/auth/sign-in" replace />;
    }

    // Check if system is unlocked
    const isUnlocked = localStorage.getItem("system_unlocked") === "true";
    if (!isUnlocked) {
        return <Navigate to="/auth/unlock" replace />;
    }

    return <Navigate to="/dashboard" replace />;
}