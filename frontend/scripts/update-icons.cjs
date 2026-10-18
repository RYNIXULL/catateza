const fs = require('fs');
const path = require('path');

const map = {
  'LayoutDashboard': 'Gauge',
  'ShoppingCart': 'ShoppingBag',
  'Package': 'Boxes',
  'Users': 'UsersRound',
  'Settings': 'SlidersHorizontal',
  'Store': 'Building2',
  'BarChart3': 'AreaChart',
  'DollarSign': 'Banknote',
  'Search': 'SearchCode',
  'Plus': 'PlusCircle',
  'Edit': 'FileSignature',
  'Trash2': 'Trash',
  'TrendingUp': 'Activity',
  'CalendarRange': 'CalendarDays',
  'Wallet': 'WalletCards'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace imports and usages
  for (const [oldIcon, newIcon] of Object.entries(map)) {
    // 1. Replace inside import statement from 'lucide-react'
    const importRegex = new RegExp(`\\b${oldIcon}\\b`, 'g');
    if (importRegex.test(content) && content.includes('lucide-react')) {
      content = content.replace(importRegex, newIcon);
      changed = true;
    }
    
    // JSX element
    const jsxRegex = new RegExp(`<${oldIcon}\\b`, 'g');
    if (jsxRegex.test(content)) {
      content = content.replace(jsxRegex, `<${newIcon}`);
      changed = true;
    }
    
    // Icon references e.g. icon: OldIcon
    const refRegex = new RegExp(`icon: ${oldIcon}\\b`, 'g');
    if (refRegex.test(content)) {
      content = content.replace(refRegex, `icon: ${newIcon}`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
