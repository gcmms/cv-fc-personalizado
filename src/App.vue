<script setup>
import { ref } from "vue";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const loading = ref(false);
const generating = ref(false);
const statusMessage = ref("");
const isError = ref(false);
const profile = ref(null);
const previewRef = ref(null);
const uploadedFileName = ref("");

const defaultSections = () => [
  { title: "Resumo do perfil", body: "Edite o resumo extraído ou adapte ao contexto FCamara." },
  { title: "Experiência", body: "Liste experiências relevantes, desafios e resultados." },
  { title: "Competências", body: "Habilidades técnicas e comportamentais observadas." }
];

const sections = ref(defaultSections());

const formatDate = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);

const resetData = () => {
  profile.value = null;
  uploadedFileName.value = "";
  sections.value = defaultSections();
  statusMessage.value = "";
  isError.value = false;
};

const extractTextFromPdf = async (arrayBuffer) => {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = Math.min(doc.numPages, 3); // limita leitura para performance
  let fullText = "";
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str).filter(Boolean);
    fullText += strings.join(" ") + "\n";
  }
  return fullText;
};

const parseProfileText = (text) => {
  const lines = text
    .split(/\n|•|-|\u2022/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const name = lines[0] || "Nome não identificado";
  const headline = lines[1] || "Headline não identificada";
  const summaryText = lines.slice(2).join(" ");
  return {
    name,
    headline,
    summary: summaryText || "Resumo não identificado.",
    raw: text
  };
};

const handleFile = async (evt) => {
  const file = evt.target.files?.[0];
  if (!file) return;
  if (file.type !== "application/pdf") {
    statusMessage.value = "Envie um PDF.";
    isError.value = true;
    return;
  }
  loading.value = true;
  isError.value = false;
  statusMessage.value = "Lendo PDF...";
  try {
    const buffer = await file.arrayBuffer();
    const text = await extractTextFromPdf(buffer);
    const parsed = parseProfileText(text);
    uploadedFileName.value = file.name;
    profile.value = parsed;
    // pré-preenche seções com base no texto extraído
    sections.value = [
      { title: "Resumo do perfil", body: parsed.summary.slice(0, 800) },
      { title: "Experiência", body: "Adicione experiências relevantes aqui." },
      { title: "Competências", body: "Adicione competências e habilidades observadas." }
    ];
    statusMessage.value = "PDF processado. Revise as seções e gere o PDF.";
  } catch (err) {
    statusMessage.value = err.message || "Falha ao ler o PDF.";
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

const addSection = () => {
  sections.value.push({ title: "Nova seção", body: "" });
};

const generatePdf = async () => {
  if (!profile.value) {
    statusMessage.value = "Envie um PDF antes de gerar.";
    isError.value = true;
    return;
  }
  generating.value = true;
  statusMessage.value = "Renderizando PDF...";
  isError.value = false;
  try {
    const element = previewRef.value;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#0c1116" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
    let heightLeft = pdfHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
    while (heightLeft > 0) {
      position -= pdf.internal.pageSize.getHeight();
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
    const safeTitle = (profile.value.name || "perfil").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    pdf.save(`fcamara-perfil-${safeTitle}.pdf`);
    statusMessage.value = "PDF gerado com sucesso.";
  } catch (err) {
    statusMessage.value = err.message || "Erro ao gerar PDF.";
    isError.value = true;
  } finally {
    generating.value = false;
  }
};
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="brand">
        <img src="https://www.fcamara.com.br/wp-content/uploads/2021/12/cropped-logo.png" alt="FCamara logo" />
        <div>
          <p class="eyebrow">FCamara • Ferramenta interna</p>
          <h1>Padronização de Perfil (PDF)</h1>
          <p class="muted">Envie o PDF do perfil, ajuste as seções e gere um PDF com identidade FCamara.</p>
        </div>
      </div>
    </header>

    <main class="layout">
      <section class="card">
        <p class="panel-title">Upload de PDF</p>
        <label>
          <span>Selecione o PDF do perfil (ex.: export do LinkedIn)</span>
          <input type="file" accept="application/pdf" @change="handleFile" />
        </label>
        <p class="mini" v-if="uploadedFileName">Arquivo: {{ uploadedFileName }}</p>
        <button class="primary" :disabled="loading || generating" @click="generatePdf">
          {{ generating ? "Gerando..." : "Baixar PDF" }}
        </button>
        <p v-if="statusMessage" class="status" :class="{ error: isError }">
          {{ statusMessage }}
        </p>

        <p class="panel-title spaced">Seções do PDF</p>
        <div v-for="(section, idx) in sections" :key="idx" class="section-editor">
          <input v-model="section.title" placeholder="Título da seção" />
          <textarea v-model="section.body" placeholder="Conteúdo da seção"></textarea>
        </div>
        <button class="ghost" @click="addSection">Adicionar seção</button>

        <div class="actions">
          <button class="ghost" @click="resetData">Limpar</button>
        </div>
        <p class="mini">O texto das seções é editável; preenchemos com o conteúdo extraído do PDF.</p>
      </section>

      <section class="card preview">
        <div class="preview-inner" ref="previewRef">
          <div class="preview-top">
            <span class="badge">FCamara • Perfil</span>
            <img src="https://www.fcamara.com.br/wp-content/uploads/2021/12/cropped-logo.png" alt="logo" />
          </div>
          <div class="preview-main">
            <p class="muted">Nome</p>
            <h2>{{ profile?.name || "Aguardando PDF..." }}</h2>
            <p class="muted">Headline</p>
            <p class="link">{{ profile?.headline || "—" }}</p>

            <div v-if="profile?.summary" class="section">
              <h4>Resumo</h4>
              <p>{{ profile.summary }}</p>
            </div>
          </div>

          <div class="sections">
            <div v-for="(section, idx) in sections" :key="idx" class="section">
              <h4>{{ section.title || "Seção " + (idx + 1) }}</h4>
              <p>{{ section.body || "Edite o texto desta seção." }}</p>
            </div>
          </div>
          <p class="mini end">Gerado em {{ formatDate(new Date()) }}</p>
        </div>
      </section>
    </main>
  </div>
</template>
