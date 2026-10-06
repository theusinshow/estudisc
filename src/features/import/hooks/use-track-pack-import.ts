"use client";
import {readValidatedResponse} from "@/lib/api-response";
import {importResponseSchema,previewResponseSchema} from "../application/client-response-contracts";
import {useId,useMemo,useState} from "react";
import {PreviewResult,ImportResult,ManualRecoveryDraft,ImportIntent,parseJsonSource,readApiError} from '../components/importer-shared';

export function useTrackPackImport(){
const inputId = useId();
const fileId = useId();
const studyWorkflowId = useId();
const createWorkflowId = useId();
const [intent, setIntent] = useState<ImportIntent>("study");
const [source, setSource] = useState("");
const [fileName, setFileName] = useState<string | null>(null);
const [preview, setPreview] = useState<PreviewResult | null>(null);
const [importResult, setImportResult] = useState<ImportResult | null>(null);
const [message, setMessage] = useState("Nenhum Pack carregado.");
const [error, setError] = useState<string | null>(null);
const [isBusy, setIsBusy] = useState(false);
const [mode, setMode] = useState<"manual" | "deepseek">("manual");
const [manualRecovery, setManualRecovery] = useState<ManualRecoveryDraft | null>(null);
const canApply = useMemo(() => preview?.status === "ready" && !isBusy, [isBusy, preview]);
function resetResult(nextSource: string) {
    setSource(nextSource);
    setPreview(null);
    setImportResult(null);
    setError(null);
    setMessage(nextSource.trim() ? "Pack carregado. Execute o preview antes de aplicar." : "Nenhum Pack carregado.");
  }
async function previewSource(nextSource = source) {
    setIsBusy(true);
    const parsed = parseJsonSource(nextSource);

    if (!parsed.ok) {
      setPreview(null);
      setImportResult(null);
      setError(parsed.message);
      setMessage("Preview bloqueado.");
      setIsBusy(false);
      return;
    }

    try {
      setError(null);
      setImportResult(null);
      setMessage("Validando Pack...");

      const response = await fetch("/api/import/track/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.value)
      });

      if (!response.ok) {
        setPreview(null);
        setError(await readApiError(response));
        setMessage(response.status === 409 ? "Conflito detectado. Aplicar permanece bloqueado." : "Preview falhou.");
        return;
      }

      const payload = await readValidatedResponse(response, previewResponseSchema);
      setPreview(payload);
      setMessage(
        payload.status === "already_imported"
          ? "Pack já importado. Nenhuma mutação necessária."
          : "Preview válido. Aplicar liberado."
      );
    } finally {
      setIsBusy(false);
    }
  }
async function applySource() {
    setIsBusy(true);
    const parsed = parseJsonSource(source);

    if (!parsed.ok) {
      setError(parsed.message);
      setMessage("Aplicação bloqueada.");
      setIsBusy(false);
      return;
    }

    try {
      setError(null);
      setMessage("Aplicando Pack...");

      const response = await fetch("/api/import/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.value)
      });

      if (!response.ok) {
        setImportResult(null);
        setError(await readApiError(response));
        setMessage(response.status === 409 ? "Conflito detectado. Nada foi aplicado." : "Aplicação falhou.");
        return;
      }

      const payload = await readValidatedResponse(response, importResponseSchema);
      setImportResult(payload);
      setMessage(payload.status === "already_imported" ? "Pack já estava importado." : "Pack aplicado ao catálogo.");
    } finally {
      setIsBusy(false);
    }
  }
function handlePreview() {
    void previewSource();
  }
function handleApply() {
    void applySource();
  }
function handleExampleLoad() {
    void (async () => {
      setIsBusy(true);
      setError(null);
      setMessage("Carregando Pack exemplo...");

      try {
        const response = await fetch("/api/import/track/example");
        if (!response.ok) {
          setError("Não foi possível carregar o Pack exemplo.");
          setMessage("Carregamento falhou.");
          return;
        }

        const payload = await response.json();
        const nextSource = JSON.stringify(payload, null, 2);
        setFileName("javascript-fundamentals.track.json");
        resetResult(nextSource);
        await previewSource(nextSource);
      } finally {
        setIsBusy(false);
      }
    })();
  }
function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    void (async () => {
      setIsBusy(true);
      const text = await file.text();
      setFileName(file.name);
      resetResult(text);
      setIsBusy(false);
    })();
  }
return {inputId,fileId,studyWorkflowId,createWorkflowId,intent,setIntent,source,fileName,setFileName,preview,importResult,message,error,isBusy,mode,setMode,manualRecovery,setManualRecovery,canApply,resetResult,handlePreview,handleApply,handleExampleLoad,handleFileChange};
}
