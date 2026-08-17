/**
 * tool-registry.js — single source of truth for every tool's metadata.
 *
 * To add Tool #11:
 *   1. Create /js/tools/your-tool.js exporting an object with
 *      { id, mount(container, context) }.
 *   2. Add one entry below.
 * Nothing else needs to change — search, categories, favorites,
 * recent, routing, and the workspace shell all read from this list.
 */

export const TOOL_REGISTRY = [
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'Math',
    icon: '🧮',
    description: 'Quick everyday calculations',
    loader: () => import('../tools/calculator.js'),
  },
  {
    id: 'percentage',
    name: 'Percentage Calculator',
    category: 'Math',
    icon: '📊',
    description: 'Find percentage, increase or decrease',
    loader: () => import('../tools/percentage.js'),
  },
  {
    id: 'cgpa',
    name: 'CGPA Calculator',
    category: 'Math',
    icon: '🎓',
    description: 'Compute CGPA from subject grades',
    loader: () => import('../tools/cgpa.js'),
  },
  {
    id: 'id-card',
    name: 'ID Card Generator',
    category: 'Documents',
    icon: '🪪',
    description: 'Design and export a front/back ID card as PDF',
    loader: () => import('../tools/id-card.js'),
  },
  {
    id: 'certificate',
    name: 'Certificate Generator',
    category: 'Documents',
    icon: '🏆',
    description: 'Create a printable certificate of completion',
    loader: () => import('../tools/certificate.js'),
  },
  {
    id: 'invoice',
    name: 'Invoice Generator',
    category: 'Documents',
    icon: '🧾',
    description: 'Build a simple itemised invoice',
    loader: () => import('../tools/invoice.js'),
  },
  {
    id: 'qr-code',
    name: 'QR Code Generator',
    category: 'Utilities',
    icon: '🔳',
    description: 'Turn text or a link into a QR code',
    loader: () => import('../tools/qr-code.js'),
  },
  {
    id: 'password',
    name: 'Password Generator',
    category: 'Utilities',
    icon: '🔐',
    description: 'Generate a strong random password',
    loader: () => import('../tools/password.js'),
  },
  {
    id: 'text-counter',
    name: 'Word & Character Counter',
    category: 'Utilities',
    icon: '📝',
    description: 'Count words, characters and reading time',
    loader: () => import('../tools/text-counter.js'),
  },
  {
    id: 'image-tool',
    name: 'Image Resizer & Compressor',
    category: 'Utilities',
    icon: '🖼️',
    description: 'Resize and compress an image in your browser',
    loader: () => import('../tools/image-tool.js'),
  },
  {
    id: 'upsdm-id-card',
    name: 'UPSDM ID Card Maker',
    category: 'Documents',
    icon: '🪪',
    description: 'UPSDM ID Card Generator Tool',
    loader: () => import('../tools/upsdm-id-card.js'),
  },
  {
    id: 'pdf-editor',
    name: 'PDF Editor',
    category: 'Documents',
    icon: '📄',
    description: 'Edit PDF text, add text, rotate or delete pages',
    loader: () => import('../tools/pdf-editor.js'),
  },
  {
    id: 'passport-photo',
    name: 'Passport Photo Maker',
    category: 'Documents',
    icon: '🛂',
    description: 'Crop, remove background and print-ready passport photo sheet banao',
    loader: () => import('../tools/passport-photo.js'),
  },
  {
    id: 'file-compressor',
    name: 'Smart File Compressor',
    category: 'Documents',
    icon: '🗜️',
    description: 'Images aur PDFs ko apni target size tak compress karo',
    loader: () => import('../tools/file-compressor.js'),
  },
];

export function getAllCategories() {
  return [...new Set(TOOL_REGISTRY.map((t) => t.category))];
}

export function getToolById(id) {
  return TOOL_REGISTRY.find((t) => t.id === id) || null;
}

/**
 * Validates the registry shape. Runs once at startup (dev-mode style
 * check per architecture spec §18). Throws loudly on the first problem
 * instead of failing silently later.
 */
export function validateRegistry() {
  const seenIds = new Set();
  for (const tool of TOOL_REGISTRY) {
    const required = ['id', 'name', 'category', 'icon', 'description', 'loader'];
    for (const field of required) {
      if (!tool[field]) {
        throw new Error(`Tool Registry Error: entry missing "${field}": ${JSON.stringify(tool)}`);
      }
    }
    if (typeof tool.loader !== 'function') {
      throw new Error(`Tool Registry Error: "${tool.id}".loader must be a function`);
    }
    if (seenIds.has(tool.id)) {
      throw new Error(`Tool Registry Error: Duplicate tool ID: "${tool.id}"`);
    }
    seenIds.add(tool.id);
  }
}
