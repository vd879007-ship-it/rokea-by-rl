export function optimizeImageUrl(url) {
  if (!url) return '';
  if (url.includes('cloudinary.com') && !url.includes('f_auto,q_auto')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
}

export function generateSlug(text) {
  if (!text) return "";
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductLink(p) {
  if (!p) return '/collections';
  if (p.slug) return `/product/${p.slug}`;
  if (p.id) return `/product-details?id=${p.id}`;
  return '/collections';
}

export function cleanProductDescription(desc) {
  return desc || "";
}

export function extractPriceFromDesc(desc) {
  return 0;
}

export const FALLBACK_PRODUCTS = [
  {
    id: "prod-saree-1",
    name: "Pure Kanjivaram Bridal Silk Saree",
    slug: "pure-kanjivaram-bridal-silk-saree",
    category: "sarees",
    price: 14500,
    image: "https://res.cloudinary.com/drkgkgiat/image/upload/f_auto,q_auto/v1777447204/rk_saree_banner_copy.jpg_d6mphh.jpg",
    images: [
      "https://res.cloudinary.com/drkgkgiat/image/upload/f_auto,q_auto/v1777447204/rk_saree_banner_copy.jpg_d6mphh.jpg",
      "/saree_pink_gold.png",
      "/saree_green_pink.png"
    ],
    badge: "Bestseller",
    stock: "In Stock",
    position: 1,
    description: "Pure handwoven Kanjivaram bridal silk saree with rich antique gold zari borders and opulent pallu motif. Handpicked directly from master weavers."
  },
  {
    id: "prod-jewel-1",
    name: "Heritage Antique Matte Temple Jewellery Set",
    slug: "heritage-antique-matte-temple-jewellery-set",
    category: "imitation",
    price: 6800,
    image: "/temple_jewellery_set.png",
    images: [
      "/temple_jewellery_set.png",
      "https://i.postimg.cc/cC8hrNM8/DSC01843.jpg"
    ],
    badge: "Trending",
    stock: "In Stock",
    position: 2,
    description: "Exquisite handcrafted temple jewellery necklace set featuring goddess Lakshmi motifs, ruby red stones, and authentic South Indian matte gold finish."
  },
  {
    id: "prod-saree-2",
    name: "Royal Peacock Green Soft Silk Saree",
    slug: "royal-peacock-green-soft-silk-saree",
    category: "sarees",
    price: 9200,
    image: "/saree_green_pink.png",
    images: ["/saree_green_pink.png", "/saree_dark_green.png"],
    badge: "New",
    stock: "In Stock",
    position: 3,
    description: "Lightweight premium soft silk saree in royal peacock green contrasted with a vibrant rani pink border and delicate butta detailing."
  },
  {
    id: "prod-jewel-2",
    name: "Classic Kemp & Pearl Choker Set",
    slug: "classic-kemp-and-pearl-choker-set",
    category: "imitation",
    price: 4900,
    image: "https://i.postimg.cc/cC8hrNM8/DSC01843.jpg",
    images: ["https://i.postimg.cc/cC8hrNM8/DSC01843.jpg", "/temple_jewellery_set.png"],
    badge: "Limited Edition",
    stock: "In Stock",
    position: 4,
    description: "Royal South Indian kemp stone choker handcrafted with hanging seed pearls and adjustable golden dori for bridal and festive attire."
  },
  {
    id: "prod-saree-3",
    name: "Emerald Green Heritage Dubion Silk Saree",
    slug: "emerald-green-heritage-dubion-silk-saree",
    category: "sarees",
    price: 8600,
    image: "/saree_dark_green.png",
    images: ["/saree_dark_green.png"],
    badge: "Popular",
    stock: "In Stock",
    position: 5,
    description: "Rich emerald green pure Dubion silk saree adorned with subtle woven motifs and lustrous pallu styling for elegant festive evenings."
  },
  {
    id: "prod-saree-4",
    name: "Blush Pink Gold Brocade Saree",
    slug: "blush-pink-gold-brocade-saree",
    category: "sarees",
    price: 11800,
    image: "/saree_pink_gold.png",
    images: ["/saree_pink_gold.png"],
    badge: "Featured",
    stock: "In Stock",
    position: 6,
    description: "Graceful blush pink silk saree detailed with intricate floral allover gold brocade weaving and an ornate celebratory pallu."
  }
];
