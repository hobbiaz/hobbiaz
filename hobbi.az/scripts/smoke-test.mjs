// End-to-end API smoke test (≈50 checks): sign-up with OTP, store, upload, listing,
// favourites, reviews, orders, messages, reports, password reset, CSRF.
// Needs: dev server running WITHOUT RESEND_API_KEY (so the OTP code is returned),
// a seeded database (npm run db:seed). Usage:  npm run test:smoke
// Creates throwaway "seller…@test.local" accounts in the database it talks to — never point it at production.
const B = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEMO_PW = process.env.SEED_DEMO_PASSWORD || "demo_pass_2026";
if (/hobbi\.az/.test(B)) { console.error("Refusing to run against production"); process.exit(1); }
const jars = { seller: "", buyer: "", admin: "" };
let failures = 0;

async function call(who, path, { method = "GET", body, form } = {}) {
  const headers = { Origin: B };
  if (jars[who]) headers.Cookie = jars[who];
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(B + path, { method, headers, body: payload, redirect: "manual" });
  const set = res.headers.get("set-cookie");
  if (set && who) jars[who] = set.split(";")[0];
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!cond) failures++;
}

const email = `seller${Date.now()}@test.local`;
const storeName = `Test Studio ${Date.now() % 100000}`;

let r = await call("", "/api/health");
check("health ok", r.status === 200 && r.data.database, JSON.stringify(r.data.services));

r = await call("", "/api/listings?category=keramika");
check("listings by category", r.status === 200 && r.data.items.length > 0 && r.data.items.every((p) => p.cat === "keramika"));
r = await call("", "/api/listings?q=" + encodeURIComponent("sırğa"));
check("search (az letters)", r.status === 200 && r.data.items.length > 0, r.data.items.map((p) => p.title).join(", "));

r = await call("", "/api/auth/otp", { method: "POST", body: { email, purpose: "SIGNUP" } });
const code = r.data.devCode;
check("otp sent (dev code returned)", r.status === 200 && /^\d{6}$/.test(code));
r = await call("", "/api/auth/otp/verify", { method: "POST", body: { email, purpose: "SIGNUP", code: code === "000000" ? "111111" : "000000" } });
check("wrong code rejected", r.status === 400, r.data.error);
r = await call("", "/api/auth/otp/verify", { method: "POST", body: { email, purpose: "SIGNUP", code } });
const token = r.data.token;
check("code verified", r.status === 200 && token);
r = await call("", "/api/auth/register", { method: "POST", body: { email, password: "hobbi2026", verificationToken: "x".repeat(30) } });
check("register without valid token rejected", r.status === 400, r.data.error);
r = await call("seller", "/api/auth/register", { method: "POST", body: { email, password: "hobbi2026", verificationToken: token, store: { name: storeName, categorySlug: "keramika", region: "Şəki", phone: "+994501234567" } } });
check("register seller + store", r.status === 201 && r.data.role === "SELLER");
r = await call("seller", "/api/me");
check("me has store", r.data.store?.name === storeName && r.data.store.region === "Şəki", r.data.store?.slug);
const sellerId = r.data.id, slug = r.data.store.slug;
r = await call("", "/api/auth/register", { method: "POST", body: { email, password: "hobbi2026", verificationToken: token } });
check("duplicate e-mail rejected", r.status === 409);

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(40).fill(0)]);
const form = new FormData(); form.append("file", new Blob([png], { type: "image/png" }), "a.png");
r = await call("seller", "/api/upload", { method: "POST", form });
const key = r.data.key;
check("upload image", r.status === 201 && /\.png$/.test(key));
const bad = new FormData(); bad.append("file", new Blob(["<script>"], { type: "image/png" }), "x.png");
r = await call("seller", "/api/upload", { method: "POST", form: bad });
check("fake image rejected", r.status === 415);
r = await call("seller", "/api/store", { method: "PATCH", body: { avatarKey: key, instagram: "https://instagram.com/test" } });
check("store avatar + instagram", r.status === 200 && r.data.avatarUrl === `/api/media/${key}`);

r = await call("seller", "/api/listings", { method: "POST", body: { title: "Test güldan", description: "Əl ilə hazırlanmış test güldanı", priceAzn: 25, oldPriceAzn: 40, categorySlug: "keramika", city: "Bakı", status: "PUBLISHED", images: [key] } });
const lid = r.data.id;
check("create listing", r.status === 201 && r.data.photo === `/api/media/${key}` && r.data.oldPrice === "40");
r = await call("seller", "/api/listings", { method: "POST", body: { title: "Qaralama", description: "Hələ hazır deyil olan məhsul", priceAzn: 5, categorySlug: "agac", city: "Bakı", status: "DRAFT" } });
const draftId = r.data.id;
check("create draft (no image)", r.status === 201 && r.data.status === "DRAFT");
r = await call("", `/api/listings/${draftId}`);
check("draft hidden from public", r.status === 404);
r = await call("seller", "/api/listings?owner=me");
check("my listings include draft", r.data.items.length === 2);
r = await call("", `/api/media/${key}`);
check("media served", r.status === 200);

r = await call("buyer", "/api/auth/login", { method: "POST", body: { identity: "demo-alici@demo.hobbi.invalid", password: DEMO_PW } });
check("buyer login by e-mail", r.status === 200);
r = await call("", "/api/auth/login", { method: "POST", body: { identity: storeName.toLowerCase(), password: "hobbi2026" } });
check("login by store name (case-insensitive)", r.status === 200);
r = await call("", "/api/auth/login", { method: "POST", body: { identity: "ZərgərStudio", password: DEMO_PW } });
check("demo store login (az letters)", r.status === 200);
r = await call("", "/api/auth/login", { method: "POST", body: { identity: email, password: "wrong-pass1" } });
check("wrong password rejected", r.status === 401);
r = await call("buyer", "/api/listings", { method: "POST", body: { title: "x", description: "y", priceAzn: 1, categorySlug: "agac", city: "Bakı" } });
check("buyer can't create listing", r.status === 403);

r = await call("buyer", "/api/favorites", { method: "POST", body: { listingId: lid } });
check("favorite", r.data.favorited === true);
r = await call("buyer", "/api/favorites?ids=1");
check("favorite ids", Array.isArray(r.data) && r.data.includes(lid));
r = await call("buyer", "/api/favorites", { method: "POST", body: { listingId: lid, favorited: true } });
check("favorite set idempotent", r.data.favorited === true);

r = await call("seller", `/api/listings/${lid}/reviews`, { method: "POST", body: { body: "Öz məhsulum", rating: 5 } });
check("seller can't review own", r.status === 400);
r = await call("buyer", `/api/listings/${lid}/reviews`, { method: "POST", body: { body: "Çox gözəldir", rating: 4 } });
const rid = r.data.id;
check("buyer review", r.status === 201 && r.data.rating === 4);
r = await call("buyer", `/api/listings/${lid}/reviews`, { method: "POST", body: { body: "yenə", rating: 5 } });
check("second review blocked", r.status === 409);
r = await call("buyer", `/api/listings/${lid}/reviews`, { method: "PATCH", body: { reviewId: rid, reply: "hack" } });
check("buyer can't reply as seller", r.status === 403);
r = await call("seller", `/api/listings/${lid}/reviews`, { method: "PATCH", body: { reviewId: rid, reply: "Təşəkkürlər!" } });
check("seller reply", r.status === 200 && r.data.replies[0]?.text === "Təşəkkürlər!");
r = await call("", `/api/listings/${lid}`);
check("detail has rating + counts", r.data.rating === 4 && r.data.favoriteCount === 1 && r.data.reviewCount === 1);

r = await call("buyer", "/api/orders", { method: "POST", body: { listingId: lid, note: "Çatdırılma Nərimanov" } });
const oid = r.data.id;
check("order created", r.status === 201 && r.data.status === "PENDING");
r = await call("seller", "/api/orders", { method: "POST", body: { listingId: lid } });
check("seller can't order own", r.status === 400);
r = await call("seller", "/api/orders?role=seller");
check("seller sees order with buyer contact", r.data[0]?.id === oid && r.data[0].buyer?.email);
r = await call("buyer", `/api/orders/${oid}`, { method: "PATCH", body: { status: "ACCEPTED" } });
check("buyer can't accept", r.status === 409);
r = await call("seller", `/api/orders/${oid}`, { method: "PATCH", body: { status: "ACCEPTED" } });
check("seller accepts", r.data.status === "ACCEPTED");
r = await call("buyer", "/api/orders");
check("buyer sees accepted order", r.data[0]?.status === "ACCEPTED" && r.data[0].buyer === undefined);

r = await call("buyer", "/api/conversations", { method: "POST", body: { recipientId: sellerId, listingId: lid, body: "Salam, ölçüsü nədir?" } });
const cid = r.data.id;
check("start conversation", r.status === 201);
r = await call("seller", "/api/conversations");
check("seller sees conversation", r.data[0]?.id === cid);
r = await call("seller", `/api/conversations/${cid}/messages`, { method: "POST", body: { body: "20 sm" } });
check("seller replies", r.status === 201);
r = await call("buyer", `/api/conversations/${cid}/messages`);
check("buyer reads thread", r.data.length === 2 && r.data[1].body === "20 sm");

r = await call("buyer", "/api/reports", { method: "POST", body: { listingId: lid, reason: "OTHER", details: "test" } });
check("report", r.status === 201);

r = await call("", `/api/stores/${encodeURIComponent(slug)}`);
check("public store page", r.status === 200 && r.data.listings.length === 1 && r.data.rating === 4);
r = await call("", "/api/auth/otp", { method: "POST", body: { email: "nobody@nowhere.az", purpose: "RESET" } });
check("reset for unknown e-mail looks the same", r.status === 200 && !r.data.devCode);
r = await call("", "/api/auth/otp", { method: "POST", body: { email, purpose: "RESET" } });
r = await call("", "/api/auth/password-reset", { method: "POST", body: { email, code: r.data.devCode, password: "newpass2026" } });
check("password reset", r.status === 200);
r = await call("", "/api/auth/login", { method: "POST", body: { identity: email, password: "newpass2026" } });
check("login with new password", r.status === 200);
const csrf = await fetch(B + "/api/orders", { method: "POST", headers: { Origin: "http://evil.com", "Content-Type": "application/json", Cookie: jars.buyer }, body: "{}" });
check("cross-origin POST blocked", csrf.status === 403);

console.log(`\n${failures ? failures + " FAILED" : "ALL PASSED"}  (listing ${lid}, store ${slug})`);
process.exit(failures ? 1 : 0);
