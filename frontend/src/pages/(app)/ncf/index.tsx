import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NCF_TYPES } from "@/types"
import { useNcfAuthorizations, useCreateNcfAuthorization, useUpdateNcfAuthorization, useDeleteNcfAuthorization } from "@/hooks/queries"
import type { NcfAuthorization } from "@/types"
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { queryKeys } from "@/lib/query-keys"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { usePageHeader } from "@/hooks/use-page-header"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const ncfSchema = z.object({
    ncfType: z.string().min(1, { message: "Required" }),
    series: z.string().min(1, { message: "Required" }),
    sequenceFrom: z.coerce.number().int().min(1),
    sequenceTo: z.coerce.number().int().min(1),
    expiresAt: z.string().optional(),
})

type NcfForm = z.infer<typeof ncfSchema>

export default function NcfPage() {
    const { t } = useTranslation()
    const { data: authorizations = [] } = useNcfAuthorizations()
    const deleteAuth = useDeleteNcfAuthorization()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<NcfAuthorization | null>(null)

    usePageHeader(t("ncf.title"))

    const getStatus = (auth: NcfAuthorization) => {
        if (!auth.isActive) return { label: t("ncf.status.inactive"), variant: "secondary" as const }
        if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) return { label: t("ncf.status.expired"), variant: "destructive" as const }
        if (auth.currentSequence > auth.sequenceTo) return { label: t("ncf.status.exhausted"), variant: "destructive" as const }
        return { label: t("ncf.status.active"), variant: "default" as const }
    }

    const handleAdd = () => {
        setEditTarget(null)
        setDialogOpen(true)
    }

    const handleEdit = (auth: NcfAuthorization) => {
        setEditTarget(auth)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteAuth.mutateAsync(id)
            toast.success("NCF authorization deactivated")
        } catch {
            toast.error("Failed to deactivate")
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{t("ncf.description")}</p>
                <Button onClick={handleAdd} dataCy="ncf-add-button">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("ncf.actions.add")}
                </Button>
            </div>

            <Card className="gap-0">
                <CardContent className="p-0">
                    {authorizations.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-foreground">{t("ncf.empty")}</h3>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("ncf.fields.ncfType")}</TableHead>
                                    <TableHead>{t("ncf.fields.series")}</TableHead>
                                    <TableHead className="text-right">{t("ncf.fields.sequenceFrom")}</TableHead>
                                    <TableHead className="text-right">{t("ncf.fields.sequenceTo")}</TableHead>
                                    <TableHead className="text-right">{t("ncf.fields.currentSequence")}</TableHead>
                                    <TableHead className="text-right">{t("ncf.fields.remaining")}</TableHead>
                                    <TableHead>{t("ncf.fields.status")}</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {authorizations.map((auth) => {
                                    const status = getStatus(auth)
                                    const remaining = Math.max(0, auth.sequenceTo - auth.currentSequence + 1)
                                    return (
                                        <TableRow key={auth.id}>
                                            <TableCell>
                                                <div>
                                                    <span className="font-mono text-sm mr-2">{auth.ncfType}</span>
                                                    <span className="text-muted-foreground text-sm">
                                                        {t(`ncf.types.${auth.ncfType}`) || NCF_TYPES[auth.ncfType] || auth.ncfType}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{auth.series}</TableCell>
                                            <TableCell className="text-right font-mono">{auth.sequenceFrom}</TableCell>
                                            <TableCell className="text-right font-mono">{auth.sequenceTo}</TableCell>
                                            <TableCell className="text-right font-mono">{auth.currentSequence}</TableCell>
                                            <TableCell className="text-right font-mono font-medium">
                                                {remaining > 0 ? remaining : <span className="text-red-600">0</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(auth)}
                                                        tooltip={t("ncf.actions.edit")}
                                                        dataCy={`ncf-edit-${auth.id}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(auth.id)}
                                                        tooltip={t("ncf.actions.deactivate")}
                                                        dataCy={`ncf-delete-${auth.id}`}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-700" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <NcfDialog
                open={dialogOpen}
                editTarget={editTarget}
                onOpenChange={(open) => { if (!open) setEditTarget(null); setDialogOpen(open) }}
            />
        </div>
    )
}

function NcfDialog({ open, editTarget, onOpenChange }: { open: boolean; editTarget: NcfAuthorization | null; onOpenChange: (open: boolean) => void }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const createAuth = useCreateNcfAuthorization()
    const updateAuth = useUpdateNcfAuthorization()
    const isEdit = !!editTarget

    const form = useForm<NcfForm>({
        resolver: zodResolver(ncfSchema),
        defaultValues: { ncfType: "01", series: "1", sequenceFrom: 1, sequenceTo: 100, expiresAt: "" },
    })

    useEffect(() => {
        if (editTarget) {
            form.reset({
                ncfType: editTarget.ncfType,
                series: editTarget.series,
                sequenceFrom: editTarget.sequenceFrom,
                sequenceTo: editTarget.sequenceTo,
                expiresAt: editTarget.expiresAt ? editTarget.expiresAt.split("T")[0] : "",
            })
        } else {
            form.reset({ ncfType: "01", series: "1", sequenceFrom: 1, sequenceTo: 100, expiresAt: "" })
        }
    }, [editTarget, open, form])

    const onSubmit = async (data: NcfForm) => {
        try {
            if (isEdit && editTarget) {
                await updateAuth.mutateAsync({
                    id: editTarget.id,
                    series: data.series,
                    sequenceFrom: data.sequenceFrom,
                    sequenceTo: data.sequenceTo,
                    expiresAt: data.expiresAt || undefined,
                })
                toast.success(t("ncf.upsert.messages.updateSuccess"))
            } else {
                await createAuth.mutateAsync({
                    ncfType: data.ncfType,
                    series: data.series,
                    sequenceFrom: data.sequenceFrom,
                    sequenceTo: data.sequenceTo,
                    expiresAt: data.expiresAt || undefined,
                })
                toast.success(t("ncf.upsert.messages.createSuccess"))
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.ncf.list() })
            onOpenChange(false)
        } catch {
            toast.error(isEdit ? t("ncf.upsert.messages.updateError") : t("ncf.upsert.messages.createError"))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t(`ncf.upsert.title.${isEdit ? "edit" : "create"}`)}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {!isEdit && (
                            <FormField name="ncfType" control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("ncf.fields.ncfType")}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(NCF_TYPES).map(([code, name]) => (
                                                    <SelectItem key={code} value={code}>
                                                        {code} - {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                        )}
                        <FormField name="series" control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("ncf.fields.series")}</FormLabel>
                                    <FormControl><Input {...field} placeholder="1" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="sequenceFrom" control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("ncf.fields.sequenceFrom")}</FormLabel>
                                        <FormControl><Input {...field} type="number" min="1" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField name="sequenceTo" control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("ncf.fields.sequenceTo")}</FormLabel>
                                        <FormControl><Input {...field} type="number" min="1" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                        </div>
                        <FormField name="expiresAt" control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("ncf.fields.expiresAt")}</FormLabel>
                                    <FormControl><Input {...field} type="date" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("ncf.actions.cancel")}</Button>
                            <Button type="submit" disabled={createAuth.isPending || updateAuth.isPending}>
                                {t("ncf.actions.save")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
