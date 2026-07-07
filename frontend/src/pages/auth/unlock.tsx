import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"

const UNLOCK_CODE = "151941"

export default function UnlockPage() {
    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState("")

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)

        if (code === UNLOCK_CODE) {
            localStorage.setItem("system_unlocked", "true")
            toast.success("Sistema desbloqueado correctamente")
            window.location.href = "/dashboard"
        } else {
            toast.error("Código de desbloqueo incorrecto")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-sm md:max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Desbloquear Sistema</CardTitle>
                    <CardDescription className="text-center">
                        Ingrese el código de desbloqueo para acceder al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Código de Desbloqueo</Label>
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Ingrese el código"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading || !code}>
                            {loading ? "Verificando..." : "Desbloquear"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
