const projectData = {
  "internship-1": {
    type: "Internship/Co-op",
    title: "Siemens Healthineers - Blood Analysis Automation",
    description:
      "Re&D Engineering/Scientist Assistant (Ottawa, ON), September 2024 to April 2025.",
    custom: "siemens",
    companyName: "Siemens Healthineers",
    companyUrl: "https://www.siemens-healthineers.com/",
    companyLogo: "images/siemens.svg.png",
    roleTitle: "R&D Engineering/Scientist Assistant",
    location: "Ottawa, ON",
    period: "September 2024 to April 2025",
    responsibilitiesParagraph:
      "As a R&D Engineering/Scientist Assistant at Siemens Healthineers (Ottawa, ON), I trained the NextGen Epoc Blood Analysis System using comparative data from ABL800 FLEX, Cobas Roche, Rapidpoint 500, and other industry-standard machines. I automated outlier detection and data visualization in JMP to reduce data-cleaning time from hours to minutes, prepared analyte target ranges for BUN, Na+, lactate, glucose, and pCO2, and mentored incoming co-op students by creating onboarding resources to support smooth team transitions.",
    bullets: [
      "Trained the NextGen Epoc Blood Analysis System using comparative data from ABL800 FLEX, Cobas Roche, Rapidpoint 500, and other industry-standard machines.",
      "Automated outlier detection and data visualization in JMP, reducing data cleaning time from hours to minutes.",
      "Prepared target ranges in blood samples for analytes such as BUN, Na+, lactate, glucose, and pCO2.",
      "Mentored and trained incoming co-op students, and created onboarding resources for smoother team transitions."
    ]
  },
  "internship-2": {
    type: "Internship/Co-op",
    title: "Canada Revenue Agency - InfoDoc Webforms QA",
    description:
      "Junior IT Analyst (Ottawa, ON), January 2024 to April 2024.",
    custom: "cra",
    companyName: "Canada Revenue Agency (CRA)",
    companyUrl: "https://www.canada.ca/en/revenue-agency.html",
    companyLogo: "images/cra.png",
    roleTitle: "Junior IT Analyst",
    location: "Ottawa, ON",
    period: "January 2024 to April 2024",
    responsibilitiesParagraph:
      "As a Junior IT Analyst at the Canada Revenue Agency, I developed 50+ JIRA test cases for InfoDoc webforms on a consumer-facing tax filing platform and adhered to strict project timelines.",
    bullets: [
      "Developed 50+ test cases in JIRA to support InfoDoc webforms on a consumer-facing tax filing platform.",
      "Aided in debugging webforms in the Canadian tax software system and supported issue resolution within project timelines.",
      "Collaborated with team & stakeholders to validate functionality and ensure release readiness."
    ]
  },
  "internship-progress": {
    type: "Internship/Co-op",
    title: "Randox Laboratories - Engineering Placement",
    description:
      "Engineering Placement (Systems Improvement Team), August 2025 to Present.",
    custom: "randox",
    companyName: "Randox Laboratories",
    companyUrl: "https://www.randox.com/",
    companyLogo: "images/randox.png",
    roleTitle: "Engineering Placement (Systems Improvement Team)",
    location: "Randox Laboratories",
    period: "August 2025 to Present",
    responsibilitiesParagraph:
      "As an Engineering Placement student on the Systems Improvement team at Randox Laboratories, I am developing an automated manufacturing workflow using a UR3 robotic arm and designing a LIMS platform to automatically transfer biomedical device data into a centralized database with a consumer-facing interface.",
    bullets: [
      "Currently interning with the Systems Improvement team at Randox Laboratories.",
      "Designing a LIMS platform for Randox to automatically transfer data from biomedical devices to a central database, with a consumer-facing interface."
    ]
  },
  capstone: {
    type: "Capstone",
    title: "TyroSense - Microneedle Melanoma Screening Patch",
    description:
      "Nanotechnology Engineering FYDP (University of Waterloo), currently in progress.",
    bullets: [
      "Designing a low-cost, semi-quantitative, rapid melanoma screening tool using a microneedle patch integrated with a lateral flow assay (LFA).",
      "Using hollow microneedles to collect interstitial fluid (ISF), then routing fluid through low/medium/high test lines for visible detection.",
      "Targeting tyrosinase (a melanoma-associated biomarker) with aptamer-bound AuNPs that create a colorimetric response as concentration increases.",
      "Engineering for key specs: result in under 15 minutes, minimal discomfort, single-sample workflow, and clear visual output for screening.",
      "Validation plan includes SEM verification of microneedles, standalone LFA testing, and full prototype testing on porcine skin models."
    ]
  },
  uche: {
    type: "Internship/Co-op",
    title: "UCHE - Software Engineer",
    description:
      "Software Engineer (NYC, NY), May 2023 to April 2024.",
    custom: "uche",
    companyName: "UCHE",
    companyUrl: "https://www.uche.co/",
    companyLogo: "images/uche.png",
    roleTitle: "Software Engineer",
    location: "NYC, NY",
    period: "May 2023 to April 2024",
    responsibilitiesParagraph:
      "As a Software Engineer at UCHE, I designed and deployed an automated chatbot using Python, JavaScript, and webhooks that reached over 10,000 users in one month. I led backend development for the UCHE iOS app, implemented personalized recommendation logic, and built compatibility and recommendation models using JavaScript, Python, Google Apps Script, APIs, and Xcode.",
    bullets: [
      "Designed and deployed an automated chatbot using Python, JavaScript, and webhooks, reaching over 10,000 users in one month.",
      "Led backend development for the UCHE iOS app and implemented personalized recommendation logic.",
      "Built compatibility and recommendation models using JavaScript, Python, Google Apps Script, APIs, and Xcode."
    ]
  }
};

// Always open at the intro section instead of restoring prior scroll/hash state.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.addEventListener("load", () => {
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  window.scrollTo(0, 0);
});

const modal = document.getElementById("project-modal");
const modalPanel = document.querySelector(".modal-panel");
const closeModalBtn = document.getElementById("close-modal");
const modalContent = document.getElementById("modal-content");
const projectsGallery = document.getElementById("projects-gallery");
const artworkGallery = document.getElementById("artwork-gallery");
const introSection = document.getElementById("intro");

const artworkItems = [
  { src: "images/paintings/1-61c0327e.jpg", title: "Painting 1", description: "Painting description 1" },
  { src: "images/paintings/IMG_2509.jpg", title: "Painting 2", description: "Painting description 2" },
  { src: "images/paintings/IMG_2949.jpg", title: "Painting 3", description: "Painting description 3" },
  { src: "images/paintings/IMG_3520.jpg", title: "Painting 4", description: "Painting description 4" },
  { src: "images/paintings/IMG_3658.JPG", title: "Painting 5", description: "Painting description 5" },
  { src: "images/paintings/IMG_5327.jpg", title: "Painting 6", description: "Painting description 6" },
  { src: "images/paintings/IMG_5332.jpg", title: "Painting 7", description: "Painting description 7" },
  { src: "images/paintings/IMG_5333.JPG", title: "Painting 8", description: "Painting description 8" },
  { src: "images/paintings/IMG_6469.jpg", title: "Painting 9", description: "Painting description 9" },
  { src: "images/paintings/IMG_6490.JPG", title: "Painting 10", description: "Painting description 10" },
  { src: "images/paintings/IMG_7479_Original 2.jpg", title: "Painting 11", description: "Painting description 11" },
  { src: "images/paintings/IMG_9363 2.jpg", title: "Painting 12", description: "Painting description 12" }
];

const deckOrder = [
  "internship-1",
  "internship-2",
  "internship-progress",
  "capstone",
  "uche"
];

const deckPreview = {
  "internship-1": {
    type: "Internship/Co-op",
    company: "Siemens Healthineers",
    logo: "images/siemens.svg.png",
    role: "R&D Engineering/Scientist Assistant",
    location: "Ottawa, ON",
    period: "September 2024 to April 2025",
    description:
      "Built automation and analytics workflows to improve lab data quality and speed in NextGen Epoc blood analysis operations."
  },
  "internship-2": {
    type: "Internship/Co-op",
    company: "Canada Revenue Agency",
    logo: "images/cra.png",
    role: "Junior IT Analyst",
    location: "Ottawa, ON",
    period: "January 2024 to April 2024",
    description:
      "Developed and debugged InfoDoc tax webform test cases in JIRA to support consumer-facing filing workflows."
  },
  "internship-progress": {
    type: "Internship/Co-op",
    company: "Randox Laboratories",
    logo: "images/randox.png",
    role: "Engineering Placement (Systems Improvement Team)",
    location: "Randox Laboratories",
    period: "August 2025 to Present",
    description:
      "Current placement focused on robotics automation and LIMS data integration for biomedical workflows."
  },
  capstone: {
    type: "Capstone",
    company: "TyroSense Capstone Project",
    logo: "",
    role: "Biosensor Design and Prototyping",
    location: "University of Waterloo",
    period: "In Progress",
    description:
      "Developing a microneedle + LFA biosensor concept for fast, minimally invasive melanoma screening through tyrosinase detection."
  },
  uche: {
    type: "Internship/Co-op",
    company: "UCHE",
    logo: "images/uche.png",
    role: "Software Engineer",
    location: "NYC, NY",
    period: "May 2023 to April 2024",
    description:
      "Built and integrated an automated chatbot recommendation system using Landbot, webhooks, and Google Scripts."
  }
};

function renderDefaultProject(project) {
  const bullets = project.bullets.map((bullet) => `<li>${bullet}</li>`).join("");
  const responsibilities = project.responsibilitiesParagraph
    ? `
      <article class="job-bubble">
        <h4>Job Responsibilities</h4>
        <p>${project.responsibilitiesParagraph}</p>
      </article>
    `
    : "";
  return `
    <p class="modal-type">${project.type}</p>
    <h3>${project.title}</h3>
    <p class="modal-description">${project.description}</p>
    <ul>${bullets}</ul>
    ${responsibilities}
  `;
}

function renderArtworkPiece(piece) {
  return `
    <article class="job-bubble">
      <img class="artwork-modal-image" src="${piece.src}" alt="${piece.title}" />
    </article>
  `;
}

function getArtworkPopupColor(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("rgba(255, 241, 227, 0.96)");
        return;
      }
      canvas.width = 12;
      canvas.height = 12;
      ctx.drawImage(image, 0, 0, 12, 12);
      const pixels = ctx.getImageData(0, 0, 12, 12).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const total = pixels.length / 4;
      for (let i = 0; i < pixels.length; i += 4) {
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
      }
      resolve(`rgba(${Math.round(r / total)}, ${Math.round(g / total)}, ${Math.round(b / total)}, 0.95)`);
    };
    image.onerror = () => resolve("rgba(255, 241, 227, 0.96)");
    image.src = src;
  });
}

function renderExperienceHeader(project) {
  return `
    <div class="experience-header-large">
      <img class="experience-logo-large" src="${project.companyLogo}" alt="${project.companyName} logo" />
      <p class="experience-company">${project.companyName}</p>
      <p class="experience-role">${project.roleTitle}</p>
      <p class="experience-detail">${project.location}</p>
      <p class="experience-detail">${project.period}</p>
      <a class="experience-url" href="${project.companyUrl}" target="_blank" rel="noreferrer">
        URL: ${project.companyUrl}
      </a>
    </div>
  `;
}

function renderSiemensProject(project) {
  return `
    <section class="siemens-layout">
      ${renderExperienceHeader(project)}
      <div class="siemens-grid">
        <div class="siemens-flow">
          <article class="siemens-block">
            <h4>Context</h4>
            <p>Siemens Healthineers is developing a new epoc blood analysis workflow. The device measures analytes such as glucose, sodium, lactate, and pCO2 directly from blood samples in under three minutes.</p>
          </article>
          <article class="siemens-block">
            <h4>Issue</h4>
            <p>Each test produces tens of thousands of data points over long runs. Filtering outliers and spotting trends manually was slow and delayed insight delivery.</p>
          </article>
          <article class="siemens-block">
            <span class="siemens-chip">My Solution</span>
            <h4>Write a JMP Script</h4>
            <p>Automate data cleanup, outlier checks, and analyte-specific bias chart generation to compare epoc output against reference machines within minutes.</p>
            <div class="siemens-steps">
              <div class="siemens-step">
                <h5>Part 1</h5>
                <p>Clean and format raw data, including numeric normalization and structure checks.</p>
                <div class="siemens-step-icon" aria-hidden="true">🧹</div>
              </div>
              <div class="siemens-step">
                <h5>Part 2</h5>
                <p>Detect extreme outliers and calculate bias between epoc and comparative devices.</p>
                <div class="siemens-step-icon" aria-hidden="true">🔎</div>
              </div>
              <div class="siemens-step">
                <h5>Part 3</h5>
                <p>Select analyte and produce bias chart to assess performance against acceptable range.</p>
                <div class="siemens-step-icon" aria-hidden="true">📈</div>
              </div>
            </div>
          </article>
        </div>
        <div class="siemens-flow">
          <article class="siemens-block">
            <h4>Results</h4>
            <p>The script processes each analyte with its own method and graph. Final plots make it easy to confirm whether analyte performance remains within acceptable range and to filter data rapidly.</p>
          </article>
          <article class="siemens-graph-box">
            <img
              class="siemens-graph-image"
              src="images/glucose_graph.png"
              alt="Analyte glucose bias chart showing acceptable range and comparison across reference machines"
            />
          </article>
          <article class="siemens-block job-bubble">
            <h4>Job Responsibilities</h4>
            <p>${project.responsibilitiesParagraph}</p>
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderCraProject(project) {
  return `
    <section class="cra-layout">
      ${renderExperienceHeader(project)}
      <div class="cra-context">
        <article class="cra-context-card">
          <h4>Context</h4>
          <p>CRA is the Canada Revenue Agency. During this internship, I worked on the InfoDoc team supporting consumer-facing tax webforms and quality assurance workflows.</p>
        </article>
      </div>
      <div class="cra-steps">
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">📄</div>
          <h4>Read Through Business Requirements</h4>
          <p>Reviewed requirement documents and acceptance criteria to define expected webform behavior before testing began.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">🧪</div>
          <h4>Create Test Cases Based On Requirements</h4>
          <p>Built structured test cases in JIRA, including valid and edge-case scenarios, to verify platform reliability.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">💻</div>
          <h4>Test Website</h4>
          <p>Executed test suites on InfoDoc consumer-facing tax forms and documented outcomes against expected results.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">🐞</div>
          <h4>Identify Issues</h4>
          <p>Investigated defects and reproducible failures, then clearly logged impact, priority, and replication steps.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">✅</div>
          <h4>Make Necessary Modifications In JIRA</h4>
          <p>Updated JIRA tickets, tracked fixes, and re-validated resolved defects to ensure implemented changes worked.</p>
        </article>
      </div>
      <div class="cra-context">
        <article class="cra-context-card job-bubble">
          <h4>Job Responsibilities</h4>
          <p>${project.responsibilitiesParagraph}</p>
        </article>
      </div>
    </section>
  `;
}

function renderUcheProject(project) {
  return `
    <section class="uche-layout">
      ${renderExperienceHeader(project)}

      <article class="uche-block">
        <h4>Context</h4>
        <p>UCHE.co is an ML startup in Brooklyn, New York building a marketplace of hair products for people with curly hair from marginalized groups.</p>
      </article>

      <article class="uche-block">
        <h4>Issue</h4>
        <p>The recommendation process was fully manual, causing long waiting times and high team effort for customer-specific product matching.</p>
      </article>

      <article class="uche-block">
        <span class="uche-chip">My Solution</span>
        <h4>Create a Chatbot</h4>
        <p>Implemented an automated recommendation workflow using Landbot, webhooks, and Google Scripts to collect user responses and return product suggestions instantly.</p>
        <div class="uche-steps">
          <div class="uche-step">
            <h5>1. Landbot Workflow</h5>
            <p>Designed user-facing flow, chatbot logic, and data capture in Landbot.</p>
          </div>
          <div class="uche-step">
            <h5>2. Webhooks + Google Scripts</h5>
            <p>Connected Landbot to Google Scripts to process answers and compute recommendation outputs.</p>
          </div>
        </div>
      </article>

      <article class="uche-block">
        <h4>Implementation Visuals</h4>
        <div class="uche-images">
          <figure class="uche-image-card">
            <img src="images/landbot.png" alt="Landbot flow matrix used for chatbot workflow" />
            <figcaption>Landbot conversation matrix and flow design</figcaption>
          </figure>
          <figure class="uche-image-card">
            <img src="images/chatbot.png" alt="Chatbot response output with product recommendations" />
            <figcaption>Automated chatbot recommendation response</figcaption>
          </figure>
        </div>
      </article>

      <article class="uche-block">
        <h4>Results</h4>
        <p>Google Script posted structured JSON product information back to Landbot, enabling an automated chatbot that provided instant personalized recommendations and reduced manual recommendation workload.</p>
      </article>

      <article class="uche-block job-bubble">
        <h4>Job Responsibilities</h4>
        <p>${project.responsibilitiesParagraph}</p>
      </article>
    </section>
  `;
}

function renderRandoxProject(project) {
  return `
    <section class="cra-layout">
      ${renderExperienceHeader(project)}
      <div class="cra-context">
        <article class="cra-context-card">
          <h4>Context</h4>
          <p>I am currently completing my engineering placement at Randox Laboratories on the Systems Improvement team, focused on automation and digital process integration.</p>
        </article>
      </div>
      <div class="cra-steps">
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">🤖</div>
          <h4>Manufacturing Automation</h4>
          <p>Developing an automated manufacturing process using a UR3 robotic arm to improve repeatability and operational efficiency.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">🧬</div>
          <h4>LIMS Platform Design</h4>
          <p>Designing a LIMS solution that transfers biomedical device output into a centralized data environment.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">🗄️</div>
          <h4>Data Integration</h4>
          <p>Building automated data pathways to reduce manual handling and improve consistency across device records.</p>
        </article>
        <article class="cra-step">
          <div class="cra-step-icon" aria-hidden="true">🖥️</div>
          <h4>Interface Development</h4>
          <p>Supporting a consumer-facing interface that surfaces laboratory information clearly for end users.</p>
        </article>
      </div>
      <div class="cra-context">
        <article class="cra-context-card">
          <h4>Project Status</h4>
          <p>This placement is in progress, with active implementation, testing, and iteration across both robotics automation and LIMS architecture.</p>
        </article>
      </div>
      <div class="cra-context">
        <article class="cra-context-card job-bubble">
          <h4>Job Responsibilities</h4>
          <p>${project.responsibilitiesParagraph}</p>
        </article>
      </div>
    </section>
  `;
}

function openModal(projectKey) {
  if (projectKey.startsWith("artwork-")) {
    const index = Number(projectKey.replace("artwork-", ""));
    const piece = artworkItems[index];
    if (!piece) return;
    modal.classList.add("artwork");
    modal.classList.remove("wide");
    modalContent.innerHTML = renderArtworkPiece(piece);
    if (modalPanel) {
      modalPanel.style.background = "";
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    if (modalPanel) {
      modalPanel.scrollTop = 0;
      window.requestAnimationFrame(updateModalScrollIndicator);
    }
    return;
  }

  const project = projectData[projectKey];
  if (!project) return;

  modal.classList.remove("artwork");
  const useWideModal = project.custom === "siemens" || project.custom === "uche";
  modal.classList.toggle("wide", useWideModal);
  modalContent.innerHTML =
    project.custom === "siemens"
      ? renderSiemensProject(project)
      : project.custom === "cra"
        ? renderCraProject(project)
      : project.custom === "uche"
        ? renderUcheProject(project)
      : project.custom === "randox"
        ? renderRandoxProject(project)
      : renderDefaultProject(project);
  if (modalPanel) {
    modalPanel.style.background = "";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  if (modalPanel) {
    modalPanel.scrollTop = 0;
    window.requestAnimationFrame(updateModalScrollIndicator);
  }
}

function renderArtworkGallery() {
  if (!artworkGallery) return;
  const cards = artworkItems
    .map(
      (piece, index) => `
      <article class="artwork-card" data-project="artwork-${index}" role="button" tabindex="0">
        <img class="artwork-thumb" src="${piece.src}" alt="${piece.title}" />
      </article>
    `
    )
    .join("");
  artworkGallery.innerHTML = cards;
}

function closeModal() {
  modal.classList.remove("open");
  modal.classList.remove("wide");
  modal.classList.remove("artwork");
  modal.setAttribute("aria-hidden", "true");
  if (modalPanel) {
    modalPanel.style.background = "";
    modalPanel.style.setProperty("--scroll-indicator-y", "0px");
    modalPanel.style.setProperty("--scroll-indicator-opacity", "0");
  }
}

function updateModalScrollIndicator() {
  if (!modalPanel) return;
  const maxScroll = modalPanel.scrollHeight - modalPanel.clientHeight;
  if (maxScroll <= 0 || modal.classList.contains("artwork")) {
    modalPanel.style.setProperty("--scroll-indicator-y", "0px");
    modalPanel.style.setProperty("--scroll-indicator-opacity", "0");
    return;
  }

  const indicatorSize = 14;
  const topPadding = 14;
  const bottomPadding = 14;
  const travel = Math.max(modalPanel.clientHeight - topPadding - bottomPadding - indicatorSize, 0);
  const progress = modalPanel.scrollTop / maxScroll;
  const y = travel * progress;

  modalPanel.style.setProperty("--scroll-indicator-y", `${y}px`);
  modalPanel.style.setProperty("--scroll-indicator-opacity", "1");
}

function renderGallery() {
  if (!projectsGallery) return;
  const cards = deckOrder.map((key) => {
    const preview = deckPreview[key];
    if (!preview) return "";
    const logo = preview.logo
      ? `<img class="gallery-logo" src="${preview.logo}" alt="${preview.company} logo" />`
      : "";
    return `
      <article class="gallery-card" data-project="${key}">
        <p class="gallery-type">${preview.type}</p>
        ${logo}
        <h3 class="gallery-company">${preview.company}</h3>
        <p class="gallery-meta">Role: ${preview.role}</p>
        <p class="gallery-meta">Location: ${preview.location}</p>
        <p class="gallery-meta">Period: ${preview.period}</p>
        <p class="gallery-description">${preview.description}</p>
        <p class="gallery-hint">Open details from the Experience page cards.</p>
      </article>
    `;
  }).join("");
  projectsGallery.innerHTML = cards;
}

function bindProjectTriggers(nodes) {
  nodes.forEach((card) => {
    if (card.dataset.projectBound === "true") return;
    card.dataset.projectBound = "true";
    card.addEventListener("click", () => openModal(card.dataset.project));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(card.dataset.project);
      }
    });
  });
}

function initializeExperienceHoverGradient() {
  const cards = document.querySelectorAll(".experience-card, .about-narrative-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });

    card.addEventListener("mouseenter", () => {
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    });
  });
}

function initializeTrailAnimation() {
  const trailLines = document.querySelectorAll(".s-trail-static-line");
  if (!trailLines.length || !introSection) return;

  // Start hidden, then draw in once on initial page load.
  document.body.classList.add("trail-hidden");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove("trail-hidden");
      window.setTimeout(() => {
        document.body.classList.add("intro-ready");
      }, 1200);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      const introActive = entry.isIntersecting && entry.intersectionRatio >= 0.55;
      document.body.classList.toggle("trail-hidden", !introActive);
    },
    { threshold: [0.55] }
  );

  observer.observe(introSection);
}

function initializeAboutTyping() {
  const aboutSection = document.getElementById("about");
  if (!aboutSection) return;

  const targets = Array.from(
    aboutSection.querySelectorAll(".about-narrative-card h3, .about-narrative-card p")
  );
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const originalContent = targets.map((el) => ({
    el,
    text: el.textContent,
    height: el.offsetHeight
  }));

  // Start blank: reserve each line's space, then clear text until typing begins.
  originalContent.forEach((item) => {
    item.el.style.minHeight = `${item.height}px`;
    item.el.textContent = "";
  });

  async function typeElement(el, text, baseDelay) {
    el.classList.add("typing-cursor");

    let index = 0;
    while (index < text.length) {
      const chunk = Math.min(text.length - index, Math.ceil(Math.random() * 3));
      index += chunk;
      el.textContent = text.slice(0, index);
      const jitter = Math.random() * 10;
      // Fast typewriter feel with slight timing jitter.
      await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
    }

    el.classList.remove("typing-cursor");
    el.style.minHeight = "";
  }

  async function playTyping() {
    if (aboutSection.dataset.typingPlayed === "true") return;
    aboutSection.dataset.typingPlayed = "true";

    for (const item of originalContent) {
      const delay = item.el.tagName === "H3" ? 10 : 5;
      await typeElement(item.el, item.text, delay);
      await new Promise((resolve) => setTimeout(resolve, 55));
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
        playTyping();
        observer.disconnect();
      }
    },
    { threshold: [0.55] }
  );

  observer.observe(aboutSection);
}

renderGallery();
renderArtworkGallery();
bindProjectTriggers(document.querySelectorAll(".experience-card[data-project]"));
bindProjectTriggers(document.querySelectorAll(".artwork-card[data-project]"));
initializeExperienceHoverGradient();
initializeTrailAnimation();
initializeAboutTyping();

closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

if (modalPanel) {
  modalPanel.addEventListener("scroll", updateModalScrollIndicator, { passive: true });
  window.addEventListener("resize", updateModalScrollIndicator);
}
