const OWNER_PASSWORD = "owner123";

const venueContent = {
  pickleball: {
    storageKey: "sports-scene-pickleball-reviews",
    ownerKey: "sports-scene-pickleball-owner-active"
  },
  cafe: {
    storageKey: "sports-scene-cafe-reviews",
    ownerKey: "sports-scene-cafe-owner-active"
  }
};

const body = document.body;
const venueKey = body.dataset.venue;
const config = venueContent[venueKey];

if (config) {
  const form = document.querySelector("[data-review-form]");
  const list = document.querySelector("[data-review-list]");
  const count = document.querySelector("[data-review-count]");
  const ownerToggle = document.querySelector("[data-owner-toggle]");
  const viewerId = getViewerId();

  renderReviews();
  syncOwnerToggle();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const review = {
      id: crypto.randomUUID(),
      authorId: viewerId,
      name: formData.get("name").toString().trim(),
      rating: Number(formData.get("rating")),
      message: formData.get("message").toString().trim(),
      createdAt: new Date().toISOString()
    };

    if (!review.name || !review.message) {
      return;
    }

    const reviews = getReviews();
    reviews.unshift(review);
    setReviews(reviews);
    form.reset();
    renderReviews();
  });

  ownerToggle.addEventListener("click", () => {
    const active = sessionStorage.getItem(config.ownerKey) === "true";

    if (active) {
      sessionStorage.removeItem(config.ownerKey);
      syncOwnerToggle();
      renderReviews();
      return;
    }

    const password = window.prompt("Enter owner password to enable moderation:");

    if (password === OWNER_PASSWORD) {
      sessionStorage.setItem(config.ownerKey, "true");
      syncOwnerToggle();
      renderReviews();
      return;
    }

    if (password !== null) {
      window.alert("Incorrect password.");
    }
  });

  list.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-review]");

    if (!deleteButton) {
      return;
    }

    const reviewId = deleteButton.dataset.deleteReview;
    const reviews = getReviews();
    const review = reviews.find((item) => item.id === reviewId);

    if (!review) {
      return;
    }

    const isOwner = sessionStorage.getItem(config.ownerKey) === "true";
    const canDelete = isOwner || review.authorId === viewerId;

    if (!canDelete) {
      window.alert("Only the review author or the owner can delete this review.");
      return;
    }

    const nextReviews = reviews.filter((item) => item.id !== reviewId);
    setReviews(nextReviews);
    renderReviews();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === config.storageKey) {
      renderReviews();
    }
  });

  function renderReviews() {
    const reviews = getReviews();
    const isOwner = sessionStorage.getItem(config.ownerKey) === "true";

    count.textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;

    if (reviews.length === 0) {
      list.innerHTML = `
        <article class="review-card">
          <p class="empty-state">No reviews yet. Be the first to share feedback.</p>
        </article>
      `;
      return;
    }

    list.innerHTML = reviews.map((review) => {
      const isAuthor = review.authorId === viewerId;
      const canDelete = isOwner || isAuthor;
      const roleBadge = isOwner && !isAuthor ? '<span class="badge">Owner can remove</span>' : "";

      return `
        <article class="review-card">
          <div class="review-head">
            <div>
              <h3>${escapeHtml(review.name)}</h3>
              <p class="review-meta">${formatTime(review.createdAt)}</p>
            </div>
            <span class="review-rating">Rating: ${review.rating}/5</span>
          </div>
          <p>${escapeHtml(review.message)}</p>
          <div class="review-actions">
            <div class="review-meta">
              ${isAuthor ? "Your review" : "Guest review"}
              ${roleBadge}
            </div>
            ${canDelete ? `<button class="delete-btn" type="button" data-delete-review="${review.id}">Delete</button>` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

  function syncOwnerToggle() {
    const active = sessionStorage.getItem(config.ownerKey) === "true";
    ownerToggle.textContent = `Owner Mode: ${active ? "On" : "Off"}`;
    ownerToggle.classList.toggle("owner-active", active);
  }

  function getReviews() {
    const stored = localStorage.getItem(config.storageKey);
    return stored ? JSON.parse(stored) : seedReviews();
  }

  function setReviews(reviews) {
    localStorage.setItem(config.storageKey, JSON.stringify(reviews));
  }

  function seedReviews() {
    const starterReviews = venueKey === "pickleball"
      ? [
          {
            id: "seed-p1",
            authorId: "seed-author",
            name: "Aarav",
            rating: 5,
            message: "Smooth court surface and a fun rooftop setup. Evening sessions feel especially good.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
          }
        ]
      : [
          {
            id: "seed-c1",
            authorId: "seed-author",
            name: "Meera",
            rating: 4,
            message: "Nice place to cool down after a match. Seating and snacks make it easy to stay longer.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
          }
        ];

    setReviews(starterReviews);
    return starterReviews;
  }
}

function getViewerId() {
  const storedId = sessionStorage.getItem("sports-scene-viewer-id");

  if (storedId) {
    return storedId;
  }

  const nextId = crypto.randomUUID();
  sessionStorage.setItem("sports-scene-viewer-id", nextId);
  return nextId;
}

function formatTime(isoString) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoString));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
