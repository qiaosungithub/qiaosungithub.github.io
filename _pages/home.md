---
title: ""
layout: home
author_profile: true
permalink: /
---

<section class="home-hero">
  <p class="home-kicker">MIT Class of 2028 - AI + Mathematics - Generative Models</p>
  <h1>Qiao Sun</h1>
  <p class="home-lede">
    I am an undergraduate at <a href="https://www.mit.edu/">MIT</a>, double majoring in
    <a href="https://www.eecs.mit.edu/academics/undergraduate-programs/curriculum/6-4-artificial-intelligence-and-decision-making/">Artificial Intelligence and Decision Making</a>
    (Course 6-4) and <a href="https://math.mit.edu/">Mathematics</a> (Course 18).
    I work on generative modeling in He Vision Group, led by
    <a href="https://people.csail.mit.edu/kaiming/">Kaiming He</a>, as a UROP student,
    with a current focus on fast, simple, and principled
    image generation: diffusion and flow matching, normalizing flows, one-step generation, and
    multimodal understanding/generation.
  </p>
  <div class="home-actions">
    <a class="home-button" href="/assets/pdf/Qiao-Sun-CV.pdf">Download CV</a>
    <a class="home-button home-button--secondary" href="mailto:sqa24@mit.edu">Email</a>
    <a class="home-button home-button--secondary" href="https://github.com/qiaosungithub">GitHub</a>
  </div>
  <div class="home-chip-row" aria-label="Research keywords">
    <span>Diffusion Models</span>
    <span>Flow Matching</span>
    <span>Normalizing Flows</span>
    <span>Text-to-Image</span>
    <span>JAX/TPU</span>
    <span>PyTorch/GPU</span>
  </div>
</section>

<section class="home-section">
  <h2>Research</h2>
  <div class="home-focus-grid">
    <div>
      <h3>Fast generation</h3>
      <p>One-step and low-NFE image generation in pixel space and latent-free settings.</p>
    </div>
    <div>
      <h3>Principled models</h3>
      <p>Normalizing flows, diffusion, and flow matching with a focus on what structure is actually necessary.</p>
    </div>
    <div>
      <h3>Unified systems</h3>
      <p>Vision-language understanding and text-to-image generation under a shared modeling view.</p>
    </div>
  </div>
</section>

<section class="home-section">
  <h2>Publications</h2>
  <div class="publication-list">
    <article class="publication-card">
      <div class="publication-teaser publication-teaser--single">
        <a href="/assets/images/wot.png" aria-label="Open uEDM teaser image">
          <img src="/assets/images/wot.png" alt="uEDM teaser">
        </a>
      </div>
      <div class="publication-content">
        <p class="publication-venue">ICML 2025 poster - first author</p>
        <h3>Is Noise Conditioning Necessary for Denoising Generative Models?</h3>
        <p class="publication-authors">
          <strong>Q. Sun</strong>, Z. Jiang, H. Zhao, and K. He
        </p>
        <p>
          We revisit a common assumption in diffusion and flow-matching models: whether denoisers
          need explicit noise conditioning. Across eight reimplemented denoising generative models,
          uEDM shows that noise-unconditional diffusion can remain competitive, with theory matching
          the empirical behavior.
        </p>
        <p class="publication-links">
          <a href="https://arxiv.org/abs/2502.13129">Paper</a>
        </p>
      </div>
    </article>

    <article class="publication-card">
      <div class="publication-teaser publication-teaser--biflow">
        <a href="/assets/images/biflow.pdf#page=1" aria-label="Open BiFlow teaser page 1">
          <img src="/assets/images/biflow-page-1.png" alt="BiFlow forward and reverse flow diagram">
        </a>
        <a href="/assets/images/biflow.pdf#page=2" aria-label="Open BiFlow teaser page 2">
          <img src="/assets/images/biflow-page-2.png" alt="BiFlow hidden alignment diagram">
        </a>
      </div>
      <div class="publication-content">
        <p class="publication-venue">Project lead - first author</p>
        <h3>Bidirectional Normalizing Flow: From Data to Noise and Back</h3>
        <p class="publication-authors">
          Y. Lu, <strong>Q. Sun</strong>, X. Wang, Z. Jiang, H. Zhao, and K. He
        </p>
        <p>
          BiFlow revisits normalizing flows with a learned reverse map guided by hidden-state
          alignment. It removes the need for explicit inverse-flow computation, avoids slow
          autoregressive inference, and enables single-evaluation NF-based generation with strong
          fidelity.
        </p>
        <p class="publication-links">
          <a href="https://arxiv.org/abs/2512.10953">Paper</a>
        </p>
      </div>
    </article>

    <article class="publication-card">
      <div class="publication-teaser publication-teaser--pmf">
        <a class="publication-teaser__pmf-left" href="/assets/images/pmf_left.pdf" aria-label="Open pMF manifold teaser">
          <img src="/assets/images/pmf-left.png" alt="Pixel Mean Flows manifold diagram">
        </a>
        <a class="publication-teaser__pmf-right" href="/assets/images/pmf_right.pdf" aria-label="Open pMF denoising teaser">
          <img src="/assets/images/pmf-right.png" alt="Pixel Mean Flows denoising grid">
        </a>
      </div>
      <div class="publication-content">
        <p class="publication-venue">First author - one-step pixel-space generation</p>
        <h3>One-step Latent-free Image Generation with Pixel Mean Flows</h3>
        <p class="publication-authors">
          Y. Lu, S. Lu, <strong>Q. Sun</strong>, H. Zhao, Z. Jiang, X. Wang, T. Li, Z. Geng, and K. He
        </p>
        <p>
          pMF builds a strong baseline for one-step, latent-free generation by using MeanFlow with
          x-prediction directly in pixel space. The project reports 2.22 FID on ImageNet 256 and
          2.48 FID on ImageNet 512.
        </p>
        <p class="publication-links">
          <a href="https://arxiv.org/abs/2601.22158">Paper</a>
          <a href="https://github.com/Lyy-iiis/pMF">Code</a>
        </p>
      </div>
    </article>
  </div>
</section>

<section class="home-section">
  <h2>Experience</h2>
  <article class="compact-card">
    <p class="publication-venue">Jun 20 - Aug 31, 2025 - quantitative research</p>
    <h3>Quant Strategy Analyst Intern, Ubiquant Investment (Jiukun Quant)</h3>
    <p>
      Worked on quantitative strategy analysis, backtesting workflows, factor diagnostics, and
      reproducible Python research utilities for strategy evaluation.
    </p>
  </article>
</section>

<section class="home-section">
  <h2>Projects</h2>
  <article class="compact-card">
    <p class="publication-venue">MIT 6.4210 course project - robotics manipulation</p>
    <h3>Fast Humanoid Loco-Manipulation via Flow Matching</h3>
    <p>
      Reimplemented a diffusion-based humanoid loco-manipulation pipeline inspired by BeyondMimic,
      then replaced DDPM sampling with flow matching. The project used simulation data, motion
      tracking, post-hoc control guidance, and lower-latency sampling with 5 FM steps.
    </p>
  </article>
</section>

<section class="home-section">
  <h2>Education & Honors</h2>
  <div class="timeline-list">
    <div>
      <span>2024 - present</span>
      <p><strong>Massachusetts Institute of Technology</strong>, undergraduate in AI and Mathematics, GPA 5.00/5.00.</p>
    </div>
    <div>
      <span>2025</span>
      <p>Top 17 in the 2025 Putnam Mathematical Competition.</p>
    </div>
    <div>
      <span>2024</span>
      <p>2nd place in the 2024 Putnam Mathematical Competition.</p>
    </div>
    <div>
      <span>2023</span>
      <p>Gold Medal and 11th place at the International Mathematical Olympiad.</p>
    </div>
    <div>
      <span>2023 - 2024</span>
      <p>Pre-college student at Tsinghua University's Institute for Interdisciplinary Information Sciences, GPA 4.00/4.00.</p>
    </div>
    <div>
      <span>2022</span>
      <p>Gold Medal and 1st place with perfect score in the Chinese Mathematical Olympiad.</p>
    </div>
    <div>
      <span>2022 - 2024</span>
      <p>Excellent Award in Alibaba Global Mathematics Competition, top 70 among 50,000+ participants.</p>
    </div>
  </div>
</section>
