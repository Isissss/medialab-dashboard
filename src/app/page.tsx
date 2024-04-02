"use client"
import React from "react";
import { Dashboard } from "@/components/Dashboard/Dashboard";


export default function HomePage() {

    const [authenticated, setAuthenticated] = React.useState(false);

    React.useEffect(() => { 
        const password = window.prompt("Enter the password to access the dashboard");
        if (password === "npocmgt") {
            setAuthenticated(true);
        } else { 
        }

    }, [])

    if (!authenticated) {
        return <></>
    }

    return (<main className="container mx-auto flex flex-col">
        <Dashboard />
    </main>
    )
}

