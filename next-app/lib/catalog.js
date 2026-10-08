/* Browser-side READ-ONLY public catalog access.
   The public publishable key is the same public key distributed in the
   existing Dear Day website, not a secret or service-role credential.
   No write operations are performed by the migration preview. */
const BASE = "https://hpffdmldtdtwcaoemyso.supabase.co/rest/v1/";
const PUBLIC_KEY = "sb_publishable_10ZXpBIQH2bG-iseG7jpdw_DfmEUT_C";
const SLUGS = ["gifts","cakes-sweets","flowers"];

async function read(table, query) {
  const response = await fetch(BASE + table + "?" + query.toString(), {
    headers: { apikey: PUBLIC_KEY, accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Catalog read failed: " + response.status + " (" + table + ")");
  return response.json();
}
const filter = list => "in.(" + list.map(x => String(x).replace(/[^a-zA-Z0-9_-]/g,"")).join(",") + ")";

export async function loadPublicCatalog() {
  const categories = await read("categories",new URLSearchParams({
    select:"id,slug",slug:filter(SLUGS)
  }));
  const cats = new Map(categories.map(x => [String(x.id),x.slug]));
  if (!cats.size) return {gifts:[],"cakes-sweets":[],flowers:[]};
  const listings = await read("listings",new URLSearchParams({
    select:"id,partner_id,category_id,published_version_id",
    category_id:filter([...cats.keys()]),is_available:"eq.true",
    published_version_id:"not.is.null"
  }));
  if (!listings.length) return {gifts:[],"cakes-sweets":[],flowers:[]};
  const versionIds = listings.map(x => x.published_version_id).filter(Boolean);
  const partnerIds = [...new Set(listings.map(x => x.partner_id).filter(Boolean))];
  const [versions,partners] = await Promise.all([
    read("listing_versions",new URLSearchParams({
      select:"id,status,name_ar,name_en,description_ar,description_en,price,currency,media,metadata",
      id:filter(versionIds),status:"eq.published"
    })),
    read("partner_directory",new URLSearchParams({
      select:"id,name_ar,name_en,status",
      id:filter(partnerIds),status:"eq.active"
    }))
  ]);
  const vs = new Map(versions.map(x => [String(x.id),x]));
  const ps = new Map(partners.map(x => [String(x.id),x]));
  const grouped = {gifts:[],"cakes-sweets":[],flowers:[]};
  for (const row of listings) {
    const ver = vs.get(String(row.published_version_id));
    const partner = ps.get(String(row.partner_id));
    const slug = cats.get(String(row.category_id));
    if (!ver || !partner || !grouped[slug]) continue;
    const firstMedia = Array.isArray(ver.media) ? ver.media[0] : null;
    const image = typeof firstMedia?.url === "string" ? firstMedia.url : "";
    const tags = Array.isArray(ver.metadata?.tags) ? ver.metadata.tags : [];
    grouped[slug].push({
      id:String(row.id),listing_id:String(row.id),partner_id:String(row.partner_id),
      type:slug === "gifts" ? "gift" : slug === "cakes-sweets" ? "cake" : "flower",
      name_ar:ver.name_ar || ver.name_en || "",name_en:ver.name_en || ver.name_ar || "",
      desc_ar:ver.description_ar || "",desc_en:ver.description_en || "",
      vendor_ar:partner.name_ar || partner.name_en || "",vendor_en:partner.name_en || partner.name_ar || "",
      price:Number(ver.price)||0,currency:ver.currency || "EGP",
      image,meta:ver.metadata?.subcategory || "",
      score:(ver.metadata?.featured?20:0)+(tags.includes("best_seller")?10:0)+(tags.includes("new")?4:0)
    });
  }
  for (const key of SLUGS) grouped[key].sort((a,b) => b.score-a.score || a.price-b.price);
  return grouped;
}
