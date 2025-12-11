<script setup>
import { ref } from "vue";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const linkUrl = ref("");
const token = ref("");
const loading = ref(false);
const generating = ref(false);
const statusMessage = ref("");
const isError = ref(false);
const bookmark = ref(null);
const previewRef = ref(null);

const defaultSections = () => [
  { title: "Contexto", body: "Preencha o contexto do link aqui." },
  { title: "Insights", body: "Liste os principais pontos coletados." }
];

const sections = ref(defaultSections());

const formatDate = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);

const resetData = () => {
  bookmark.value = null;
  linkUrl.value = "";
  token.value = "";
  sections.value = defaultSections();
  statusMessage.value = "";
  isError.value = false;
};

const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const fetchBookmark = async () => {
  if (!linkUrl.value) {
    statusMessage.value = "Informe a URL do Linkding.";
    isError.value = true;
    return;
  }
  loading.value = true;
  isError.value = false;
  statusMessage.value = "Buscando...";
  try {
    const headers = { Accept: "application/json, text/plain, */*" };
    if (token.value.trim()) headers.Authorization = `Token ${token.value.trim()}`;
    const response = await fetch(linkUrl.value, { headers });
    if (!response.ok) throw new Error(`Erro ${response.status} ao buscar dados`);
    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { title: "Link", url: linkUrl.value, description: text.slice(0, 300) + "..." };
    }
    const tags = data.tag_names || data.tags || [];
    bookmark.value = {
      title: data.title || data.url || "Sem título",
      url: data.url || linkUrl.value,
      description: data.description || data.notes || "",
      tags: Array.isArray(tags) ? tags : []
    };
    if (!bookmark.value.description && data.html) {
      bookmark.value.description = stripHtml(data.html).slice(0, 300);
    }
    statusMessage.value = "Dados carregados. Ajuste as seções e gere o PDF.";
  } catch (err) {
    statusMessage.value = err.message || "Falha ao buscar dados.";
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

const addSection = () => {
  sections.value.push({ title: "Nova seção", body: "" });
};

const generatePdf = async () => {
  if (!bookmark.value) {
    statusMessage.value = "Busque um link antes de gerar o PDF.";
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
    const safeTitle = (bookmark.value.title || "linkding").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    pdf.save(`fcamara-linkding-${safeTitle}.pdf`);
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
          <h1>PDF de Linkding</h1>
          <p class="muted">Cole a URL do Linkding, revise as seções e gere um PDF padronizado.</p>
        </div>
      </div>
    </header>

    <main class="layout">
      <section class="card">
        <p class="panel-title">Origem</p>
        <label>
          <span>URL do Linkding (ex: https://linkding/api/bookmarks/123/)</span>
          <input v-model="linkUrl" placeholder="https://seu-linkding/api/bookmarks/123/" />
        </label>
        <label>
          <span>Token da API (opcional)</span>
          <input v-model="token" placeholder="Token ..." />
        </label>
        <button class="primary" @click="fetchBookmark" :disabled="loading">
          {{ loading ? "Buscando..." : "Buscar dados" }}
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
          <button class="primary" @click="generatePdf" :disabled="!bookmark || generating">
            {{ generating ? "Gerando..." : "Baixar PDF" }}
          </button>
          <button class="ghost" @click="resetData">Limpar</button>
        </div>
        <p class="mini">Se o endpoint devolver JSON, usamos title/url/description/tag_names automaticamente.</p>
      </section>

      <section class="card preview">
        <div class="preview-inner" ref="previewRef">
          <div class="preview-top">
            <span class="badge">FCamara • Report</span>
            <img src="https://www.fcamara.com.br/wp-content/uploads/2021/12/cropped-logo.png" alt="logo" />
          </div>
          <div class="preview-main">
            <p class="muted">Título</p>
            <h2>{{ bookmark?.title || "Aguardando dados..." }}</h2>
            <p class="muted">Link</p>
            <p class="link">{{ bookmark?.url || "—" }}</p>

            <div v-if="bookmark?.description" class="section">
              <h4>Resumo</h4>
              <p>{{ bookmark.description }}</p>
            </div>

            <div v-if="bookmark?.tags?.length" class="taglist">
              <span v-for="(tag, i) in bookmark.tags" :key="i" class="tag">#{{ tag }}</span>
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
