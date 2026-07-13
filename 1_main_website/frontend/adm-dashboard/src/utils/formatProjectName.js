/**
 * Cleans up raw project names like "TE_IS_ADM_SALE_Global_Content_Per_Platform"
 * into a human-readable form like "Content Per Platform".
 *
 * Steps:
 *  1. Strip the TE_TS_ADM_ or TE_IS_ADM_ prefix
 *  2. Strip the department/function code (e.g. SALE_, FIN_, ENG_, HR_, etc.)
 *  3. Strip common qualifiers (Global_, Regional_, Local_)
 *  4. Replace underscores with spaces
 *  5. Trim and collapse whitespace
 */

// Known department / function code prefixes (all uppercase, before the first mixed-case segment)
const DEPT_PREFIXES = [
    'SALE', 'SALES', 'FIN', 'FINANCE', 'ENG', 'ENGINEERING',
    'HR', 'HUMAN_RESOURCES', 'EXEC', 'EXECUTIVE', 'OPS', 'OPERATIONS',
    'PRICE', 'PRICING', 'PM', 'PRODUCT_MANAGEMENT', 'MOG', 'MARINE',
    'CS', 'CUSTOMER_SERVICE', 'PLANT', 'PLANTS', 'IT', 'TECH', 'TECHNOLOGY',
    'SUPPLY_CHAIN', 'LEGAL', 'MARKETING', 'MKT', 'SCM', 'QA', 'QUALITY',
];

const QUALIFIERS = ['Global', 'Regional', 'Local', 'Corp', 'Corporate', 'Intl', 'International'];

export function formatProjectName(raw) {
    if (!raw) return '';

    // Step 1: strip the main prefix
    let name = raw.replace(/^(TE_TS_ADM_|TE_IS_ADM_)/i, '');

    // Step 2: strip department prefix (greedy — try longest first)
    // Match pattern like "SALE_" or "PRODUCT_MANAGEMENT_" at the start
    const sorted = [...DEPT_PREFIXES].sort((a, b) => b.length - a.length);
    for (const dept of sorted) {
        const re = new RegExp(`^${dept}_`, 'i');
        if (re.test(name)) {
            name = name.replace(re, '');
            break;
        }
    }

    // Step 3: strip qualifier prefix like "Global_"
    for (const q of QUALIFIERS) {
        const re = new RegExp(`^${q}_`, 'i');
        if (re.test(name)) {
            name = name.replace(re, '');
            break;
        }
    }

    // Step 4: replace underscores with spaces
    name = name.replace(/_/g, ' ');

    // Step 5: trim and collapse whitespace
    name = name.replace(/\s+/g, ' ').trim();

    return name || raw;
}
