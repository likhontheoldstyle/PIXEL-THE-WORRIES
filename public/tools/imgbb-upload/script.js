/**
 * src/tools/imgbb-upload/script.js
 * ----------------------------------------------------------------
 * Fully self-contained client logic for the ImgBB Upload tool.
 * The real ImgBB API key NEVER touches the browser — every upload
 * is sent to our own backend endpoint (/api/tools/imgbb-upload/upload)
 * which attaches the secret key server-side and forwards to ImgBB.
 * ----------------------------------------------------------------
 */

(() => {
  const UPLOAD_ENDPOINT = "/api/tools/imgbb-upload/upload";

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const browseBtn = document.getElementById("browseBtn");
  const results = document.getElementById("results");
  const cardTemplate = document.getElementById("cardTemplate");
  const toastContainer = document.getElementById("toastContainer");

  function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function copyToClipboard(text, label) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast(`${label} copied to clipboard`, "success"))
      .catch(() => toast("Copy failed — please copy manually", "error"));
  }

  function buildLinks(data) {
    const url = data.url;
    const deleteUrl = data.delete_url || "";
    return {
      url,
      delete: deleteUrl,
      bbcode: `[img]${url}[/img]`,
      html: `<img src="${url}" alt="${data.title || "image"}" />`,
      markdown: `![${data.title || "image"}](${url})`,
    };
  }

  function uploadFile(file) {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    results.prepend(card);

    const img = card.querySelector(".card-img");
    const progressBar = card.querySelector(".card-progress-bar");
    const filename = card.querySelector(".card-filename");
    const status = card.querySelector(".card-status");
    const links = card.querySelector(".card-links");

    filename.textContent = file.name;
    img.src = URL.createObjectURL(file);
    status.textContent = "Uploading…";

    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_ENDPOINT);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = `${pct}%`;
      }
    };

    xhr.onload = () => {
      let payload;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload && payload.success) {
        progressBar.style.width = "100%";
        status.textContent = "Uploaded successfully";
        status.classList.add("success");

        const linkData = buildLinks(payload.data);
        links.hidden = false;
        links.querySelectorAll(".link-btn").forEach((btn) => {
          const key = btn.dataset.copy;
          btn.addEventListener("click", () => {
            const labelMap = {
              url: "Image URL",
              delete: "Delete URL",
              bbcode: "BBCode",
              html: "HTML code",
              markdown: "Markdown",
            };
            copyToClipboard(linkData[key], labelMap[key]);
          });
        });
        toast(`${file.name} uploaded`, "success");
      } else {
        const message = (payload && payload.error) || "Upload failed";
        status.textContent = message;
        status.classList.add("error");
        toast(`${file.name}: ${message}`, "error");
      }
    };

    xhr.onerror = () => {
      status.textContent = "Network error";
      status.classList.add("error");
      toast(`${file.name}: network error`, "error");
    };

    xhr.send(formData);
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      toast("Please select image files only", "error");
      return;
    }
    files.forEach(uploadFile);
  }

  browseBtn.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target === browseBtn) return;
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-over");
    })
  );

  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag-over");
    })
  );

  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
})();
