import React from 'react';
import { 
  DrawerWrapper, 
  SectionHeader, 
  StatCard, 
  InfoCard, 
  SectionCard, 
  TimelineCard, 
  AlertCard, 
  FutureFeatureCard, 
  PlaceholderCard 
} from './SharedUI';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const renderFlagImage = (countryName) => {
  if (!countryName) return null;
  const normalized = countryName.toLowerCase().trim();
  const codes = {
    'india': 'in', 'in': 'in', 'ind': 'in',
    'united states': 'us', 'us': 'us', 'usa': 'us',
    'united kingdom': 'gb', 'uk': 'gb', 'gb': 'gb', 'gbr': 'gb',
    'germany': 'de', 'de': 'de', 'deu': 'de',
    'japan': 'jp', 'jp': 'jp', 'jpn': 'jp',
    'brazil': 'br', 'br': 'br', 'bra': 'br',
    'australia': 'au', 'au': 'au', 'aus': 'au'
  };
  const code = codes[normalized];
  if (!code) return <span className="text-sm shrink-0">🌐</span>;
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={countryName} 
      className="w-4 h-2.5 object-cover rounded-sm border border-white/10 shrink-0" 
      title={countryName}
    />
  );
};

const formatCurrency = (amount, countryName) => {
  const symbol = CURRENCY_SYMBOLS[countryName] || '$';
  return `${symbol}${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const BUSINESS_REQUIRED_ROLES = {
  'Farming': ['Farmer'],
  'Dairy': ['Farmer'],
  'Mining': ['Labourer'],
  'Garment Factory': ['Fashion Designer', 'Labourer'],
  'Food Processing Factory': ['Labourer'],
  'Construction Factory': ['Labourer'],
  'Automobile Manufacturing': ['Engineer', 'Labourer'],
  'Electronics Manufacturing': ['Engineer', 'Labourer']
};

export default function DashboardDrawer({ 
  activeTab, 
  isOpen, 
  onClose, 
  startup, 
  inventory = [], 
  transactions = [], 
  employees = [],
  producingState = {},
  onHire,
  onFire,
  user,
  onLogout
}) {
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(startup?._id || 'main');
  const [hireDrafts, setHireDrafts] = React.useState({});

  if (!isOpen) return null;

  // Render company logo
  const renderLogo = (logoStr) => {
    if (!logoStr) {
      return (
        <div className="w-full h-full flex items-center justify-center text-cyanGlow/40">
          <i className="fa-solid fa-building text-3xl"></i>
        </div>
      );
    }
    if (logoStr.trim().startsWith('<svg') || logoStr.trim().startsWith('<img')) {
      return <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: logoStr }} />;
    }
    return (
      <img
        src={logoStr}
        alt="Corporate Logo"
        className="w-full h-full object-contain rounded"
        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo.svg'; }}
      />
    );
  };

  // Helper calculations for Net Worth & Valuation
  const totalInventoryQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryAssetValuation = totalInventoryQuantity * 250; // Estimated value per unit
  const currentCash = startup?.currentBalance || 0;
  const netWorth = currentCash + inventoryAssetValuation;
  
  const totalEmployees = employees.reduce((sum, e) => sum + e.quantity, 0);
  const monthlyPayroll = employees.reduce((sum, e) => sum + (e.quantity * e.salary), 0);
  const companyValuation = (startup?.startingCapital || 50000) + currentCash + (totalEmployees * 5000) + (inventoryAssetValuation * 1.5);

  // Revenue & expense calculations (used by Profile case)
  const salesTx = transactions.filter(t => t.transactionType === 'Sale');
  const purchaseTx = transactions.filter(t => t.transactionType === 'Purchase');
  const monthlyRevenue = salesTx.reduce((sum, t) => sum + t.totalAmount, 0);
  const costOfGoodsSold = purchaseTx.reduce((sum, t) => sum + t.totalAmount, 0);
  const monthlyExpenses = costOfGoodsSold + monthlyPayroll;
  const netProfitLoss = monthlyRevenue - monthlyExpenses;

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': {
        const activeProduction = Object.values(producingState || {})[0];
        const isProducing = !!activeProduction;
        
        // Calculate efficiency based on worker availability
        const requiredRoles = BUSINESS_REQUIRED_ROLES[startup?.businessType] || [];
        const hasAllRoles = requiredRoles.every(role => {
          const emp = employees.find(e => e.employeeType === role);
          return emp && emp.quantity > 0;
        });
        const productionEfficiency = requiredRoles.length > 0
          ? (hasAllRoles ? '100%' : '0% (Staff Missing)')
          : '100%'; // Default for retail

        const statusText = isProducing 
          ? 'Producing' 
          : requiredRoles.length > 0 && !hasAllRoles 
          ? 'Idle (Staff Missing)' 
          : 'Operational';

        // Check alerts
        const alerts = [];
        if (requiredRoles.length > 0 && !hasAllRoles) {
          const missing = requiredRoles.filter(role => {
            const emp = employees.find(e => e.employeeType === role);
            return !emp || emp.quantity <= 0;
          });
          alerts.push({
            type: 'error',
            icon: 'fa-user-slash',
            text: `Workforce Shortage: Hire ${missing.join(', ')} to enable operations.`
          });
        }
        if (!isProducing && statusText !== 'Idle (Staff Missing)' && requiredRoles.length > 0) {
          alerts.push({
            type: 'warning',
            icon: 'fa-triangle-exclamation',
            text: 'Facility Idle: No active production batches running.'
          });
        }

        return (
          <div className="flex flex-col gap-6 text-sm">
            {/* Financial Snapshot */}
            <div>
              <SectionHeader icon="fa-sack-dollar" title="Financial Snapshot" />
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Current Cash Balance" value={formatCurrency(currentCash, startup?.country)} icon="fa-wallet" color="text-greenGlow" />
                <StatCard label="Net Worth" value={formatCurrency(netWorth, startup?.country)} icon="fa-chart-pie" />
                <StatCard label="Company Valuation" value={formatCurrency(companyValuation, startup?.country)} icon="fa-award" color="text-cyanGlow" />
                <StatCard label="Inventory Value" value={formatCurrency(inventoryAssetValuation, startup?.country)} icon="fa-warehouse" />
              </div>
            </div>

            {/* Live Operations */}
            <div>
              <SectionHeader icon="fa-gears" title="Live Operations" />
              <div className="flex flex-col gap-3">
                <InfoCard label="Active Production" value={isProducing ? `${activeProduction.qty}x ${activeProduction.name} (${activeProduction.remaining}s)` : 'None'} />
                <InfoCard label="Current Production Queue" value={isProducing ? '1 / 1 batches' : 'Empty'} />
                <InfoCard 
                  label="Production Status" 
                  value={statusText} 
                  color={
                    statusText === 'Producing' ? 'text-cyanGlow animate-pulse' :
                    statusText.includes('Staff Missing') ? 'text-amber-400' : 'text-greenGlow'
                  }
                />
                <InfoCard label="Number of Facilities" value="1" />
                <InfoCard label="Current Workforce" value={totalEmployees} />
                <InfoCard label="Current Storage Usage" value="Coming Soon" color="text-text-muted italic" />
              </div>
            </div>

            {/* Business Alerts */}
            <div>
              <SectionHeader icon="fa-bell" title="Business Alerts" />
              <div className="flex flex-col gap-2">
                {alerts.length > 0 ? (
                  alerts.map((alert, idx) => (
                    <AlertCard 
                      key={idx}
                      type={alert.type}
                      icon={alert.icon}
                      text={alert.text}
                    />
                  ))
                ) : (
                  <AlertCard 
                    type="success"
                    text="No active operational alerts."
                  />
                )}
              </div>
            </div>

            {/* Recent Business Activity */}
            <div>
              <SectionHeader icon="fa-receipt" title="Recent Business Activity" />
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="p-2.5 bg-black/20 border border-white/5 rounded flex justify-between items-center text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${
                          tx.transactionType === 'Sale' ? 'fa-store text-greenGlow' :
                          tx.transactionType === 'Purchase' ? 'fa-cart-shopping text-red-400' :
                          'fa-gears text-cyanGlow'
                        }`}></i>
                        <span className="text-text-secondary">
                          {tx.transactionType === 'Sale' ? `Sold ${tx.quantity} units to client` :
                           tx.transactionType === 'Purchase' ? `Purchased ${tx.quantity} units` :
                           `Processed batch of ${tx.quantity}`}
                        </span>
                      </div>
                      <span className={`font-bold ${tx.transactionType === 'Sale' ? 'text-greenGlow' : 'text-red-400'}`}>
                        {tx.transactionType === 'Sale' ? '+' : '-'}{formatCurrency(tx.totalAmount, startup?.country)}
                      </span>
                    </div>
                  ))
                ) : (
                  <PlaceholderCard 
                    title="No Activity" 
                    description="No active transaction signatures detected" 
                    icon="fa-receipt" 
                  />
                )}
              </div>
            </div>

            {/* Economy Feed */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <SectionHeader icon="fa-satellite-dish" title="Economy Feed" divider={false} />
                <span className="flex items-center gap-1.5 text-[8px] text-cyanGlow uppercase font-mono tracking-widest bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyanGlow/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyanGlow animate-pulse"></span>
                  Live Feed
                </span>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-2 font-mono text-[11px] text-text-secondary">
                <div className="flex items-center gap-2.5">
                  <span className="text-cyanGlow font-bold">[NEWS]</span>
                  <span>Steel prices rising across industrial sectors</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-cyanGlow font-bold">[NEWS]</span>
                  <span>Oil demand increasing on shipping corridor</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-cyanGlow font-bold">[NEWS]</span>
                  <span>Textile exports surge under trade multipliers</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-muted">
                  <span className="text-text-muted font-bold">[NEWS]</span>
                  <span>Food prices stable in domestic retail hubs</span>
                </div>
              </div>
            </div>

          </div>
        );
      }

      case 'Company': {
        const descType = startup?.businessType.toLowerCase().includes('manufacturing') || startup?.businessType.toLowerCase().includes('factory') 
          ? 'industrial manufacturer' 
          : startup?.businessType.toLowerCase().includes('farming') || startup?.businessType.toLowerCase().includes('dairy')
          ? 'agricultural venture'
          : 'commercial enterprise';
        const summaryText = `${startup?.startupName} is an ${descType} headquartered in ${startup?.country}. The company currently operates one production facility and is actively expanding its industrial footprint.`;

        // Chronological milestones list
        const timelineMilestones = [
          { name: 'Company Founded', date: 'Day 1', icon: 'fa-flag-checkered', completed: true },
          { name: 'First Facility Constructed (plot_5)', date: 'Day 1', icon: 'fa-building-shield', completed: true }
        ];
        
        if (totalEmployees > 0) {
          timelineMilestones.push({ name: 'First Employee Hired', date: 'Day 1', icon: 'fa-user-plus', completed: true });
        }
        
        const hasSales = transactions.some(tx => tx.transactionType === 'Sale');
        if (hasSales) {
          timelineMilestones.push({ name: 'First Marketplace Sale', date: 'Day 1', icon: 'fa-money-bill-trend-up', completed: true });
        }

        const hasProcessing = transactions.some(tx => tx.transactionType === 'Processing' || tx.transactionType === 'Produce');
        if (hasProcessing) {
          timelineMilestones.push({ name: 'First Product Produced', date: 'Day 1', icon: 'fa-cubes', completed: true });
        }

        if ((startup?.level || 1) >= 2) {
          timelineMilestones.push({ name: 'Company Reached Level 2', date: 'Day 2', icon: 'fa-circle-chevron-up', completed: true });
        }

        return (
          <div className="flex flex-col gap-6 text-sm">
            {/* 1. Corporate Identity */}
            <div className="p-5 bg-white/2 border border-white/5 rounded-lg flex items-center gap-4 bg-gradient-to-b from-glassBg to-black/30">
              <div className="w-16 h-16 p-2 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                {renderLogo(startup?.logo)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-extrabold text-base uppercase text-white truncate">
                  {startup?.startupName}
                </h3>
                <p className="text-[10px] text-cyanGlow font-mono mt-0.5 uppercase tracking-wider">
                  ID: {startup?.startupId}
                </p>
                <div className="flex flex-col gap-1 mt-2 font-mono text-[10px] text-text-secondary">
                  <div>Status: <span className="text-greenGlow font-bold">Active</span></div>
                  <div>Headquarters: <span className="text-white font-bold inline-flex items-center gap-1.5">{renderFlagImage(startup?.country)} {startup?.country}</span></div>
                  <div>HQ City: <span className="text-text-muted italic">Coming Soon</span></div>
                  <div>Sector: <span className="text-white font-bold uppercase">{startup?.industry}</span></div>
                  <div>Business Type: <span className="text-cyanGlow font-bold uppercase">{startup?.businessType}</span></div>
                  <div>Founded Date: <span className="text-text-muted italic">Coming Soon</span></div>
                  <div>Company Age: <span className="text-text-muted italic">Coming Soon</span></div>
                </div>
              </div>
            </div>

            {/* 2. Executive Corporate Summary */}
            <div className="p-4 bg-black/35 border border-white/5 rounded-lg">
              <SectionHeader icon="fa-building-user" title="Executive Profile Summary" divider={false} />
              <p className="text-xs text-text-secondary leading-relaxed font-body">
                {summaryText}
              </p>
            </div>

            {/* 3. Corporate Statistics */}
            <div>
              <SectionHeader icon="fa-chart-simple" title="Corporate Ledger & Statistics" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Company Level" value={`Lvl ${startup?.level || 1}`} />
                <InfoCard label="Reputation" value="Coming Soon" color="text-text-muted italic" />
                <InfoCard label="Company Valuation" value={formatCurrency(companyValuation, startup?.country)} color="text-cyanGlow" />
                <InfoCard label="Net Worth" value={formatCurrency(netWorth, startup?.country)} />
                <InfoCard label="Current Cash" value={formatCurrency(currentCash, startup?.country)} color="text-greenGlow" />
                <InfoCard label="Total Assets" value={formatCurrency(currentCash + inventoryAssetValuation + companyValuation, startup?.country)} />
                <InfoCard label="Inventory Value" value={formatCurrency(inventoryAssetValuation, startup?.country)} />
                <InfoCard label="Facilities Owned" value="1" />
                <InfoCard label="Active Employees" value={`${totalEmployees} personnel`} />
              </div>
            </div>

            {/* 4. Corporate Assets */}
            <div>
              <SectionHeader icon="fa-boxes-packing" title="Corporate Asset Registry" />
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-2.5">
                <div className="text-[10px] font-display uppercase tracking-widest text-text-secondary pb-1 border-b border-white/5">
                  Facilities List
                </div>
                <div className="flex items-center gap-2 text-xs text-greenGlow">
                  <i className="fa-solid fa-circle-check"></i>
                  <span className="text-white font-bold uppercase">{startup?.businessType}</span>
                  <span className="text-[9px] font-mono text-cyanGlow px-1.5 py-0.5 bg-cyan-950/20 border border-cyanGlow/10 rounded ml-auto">
                    PLOT 5
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Land Holdings */}
            <div>
              <SectionHeader icon="fa-map-location-dot" title="Land Holdings" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Owned Land" value="10 Plots" />
                <InfoCard label="Developed Plots" value="1 / 10 Plots Developed" color="text-greenGlow" />
                <InfoCard label="Expansion Available" value="9 Plots Remaining" color="text-cyanGlow" />
              </div>
            </div>

            {/* 6. Chronological Milestones Timeline */}
            <div>
              <SectionHeader icon="fa-timeline" title="Corporate Milestones Timeline" />
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-4">
                {timelineMilestones.length > 0 ? (
                  timelineMilestones.map((milestone, idx) => (
                    <TimelineCard 
                      key={idx}
                      title={milestone.name}
                      description="Milestone unlocked successfully."
                      date={milestone.date}
                      icon={milestone.icon}
                      completed={milestone.completed}
                    />
                  ))
                ) : (
                  <PlaceholderCard 
                    title="No Milestones" 
                    description="No historical milestones yet." 
                    icon="fa-timeline" 
                  />
                )}
              </div>
            </div>

            {/* 7. Corporate Reputation Card */}
            <div>
              <SectionHeader icon="fa-medal" title="Corporate Reputation" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Current Reputation" value="Coming Soon" color="text-text-muted italic" />
                <InfoCard label="Growth Trend" value="Coming Soon" color="text-text-muted italic" />
                <InfoCard label="Corporate Rating" value="Coming Soon" color="text-text-muted italic" />
                <InfoCard label="Trust Index" value="Coming Soon" color="text-text-muted italic" />
              </div>
            </div>

            {/* 8. Expansion Center */}
            <div>
              <SectionHeader icon="fa-square-plus" title="Corporate Expansion" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Purchase Land', desc: 'Acquire new plot grids.' },
                  { name: 'Construct Facility', desc: 'Build new infrastructure.' },
                  { name: 'Upgrade HQ', desc: 'Unlock administrative tiers.' },
                  { name: 'International Branch', desc: 'Acquire global trade corridors.' }
                ].map((action, idx) => (
                  <FutureFeatureCard
                    key={idx}
                    title={action.name}
                    description={action.desc}
                  />
                ))}
              </div>
            </div>

          </div>
        );
      }

      case 'Employees': {
        const getRequiredStaffCount = (businessType, role) => {
          const reqs = {
            'Farming': { 'Farmer': 1 },
            'Dairy': { 'Farmer': 1 },
            'Mining': { 'Labourer': 1 },
            'Garment Factory': { 'Fashion Designer': 1, 'Labourer': 2 },
            'Food Processing Factory': { 'Labourer': 1 },
            'Construction Factory': { 'Labourer': 2 },
            'Automobile Manufacturing': { 'Engineer': 2, 'Labourer': 3 },
            'Electronics Manufacturing': { 'Engineer': 1, 'Labourer': 1 }
          };
          const bizReqs = reqs[businessType];
          if (bizReqs && bizReqs[role] !== undefined) {
            return bizReqs[role];
          }
          return 1;
        };

        const ROLE_METADATA = {
          'Farmer': {
            icon: 'fa-wheat-awn text-emerald-400',
            description: 'Farmers — Cultivate crops and manage harvesting operations'
          },
          'Labourer': {
            icon: 'fa-helmet-safety text-amber-500',
            description: 'Labourers — Handle raw materials and execute floor tasks'
          },
          'Fashion Designer': {
            icon: 'fa-scissors text-purple-400',
            description: 'Fashion Designers — Create garment sketches and refine styles'
          },
          'Builder': {
            icon: 'fa-trowel-bricks text-orange-400',
            description: 'Builders — Lay foundations and erect facility structures'
          },
          'Engineer': {
            icon: 'fa-microchip text-cyan-400',
            description: 'Engineers — Design equipment and optimize production efficiency'
          },
          'Manager': {
            icon: 'fa-user-tie text-blue-400',
            description: 'Managers — Supervise workflows and coordinate facility operations'
          },
          'Chief': {
            icon: 'fa-crown text-yellow-400',
            description: 'Chiefs — Execute corporate strategy and govern organizational expansion'
          }
        };

        // Derived variables for payroll metrics
        const totalHired = totalEmployees;
        const employeeCapacity = 25;
        const availablePositions = Math.max(0, employeeCapacity - totalHired);
        const annualPayroll = monthlyPayroll * 12;

        const maxPayRole = employees.length > 0
          ? [...employees].sort((a, b) => b.salary - a.salary)[0]
          : null;
        const highestPaidRole = maxPayRole ? `${maxPayRole.employeeType} (${formatCurrency(maxPayRole.salary, startup?.country)}/mo)` : 'None';
        const averageSalary = totalHired > 0 ? monthlyPayroll / totalHired : 0;

        // Staffing requirements check for owned facility
        const requiredRolesList = BUSINESS_REQUIRED_ROLES[startup?.businessType] || [];
        let facilityHired = 0;
        let facilityRequired = 0;
        requiredRolesList.forEach(role => {
          const emp = employees.find(e => e.employeeType === role);
          facilityHired += emp ? emp.quantity : 0;
          facilityRequired += getRequiredStaffCount(startup?.businessType, role);
        });
        const efficiencyPercent = facilityRequired > 0 
          ? Math.min(100, Math.round((facilityHired / facilityRequired) * 100))
          : 100;

        // Hired workforce Satisfaction and Idle counts
        const isAdequatelyStaffed = efficiencyPercent >= 100;
        const efficiencyStatus = isAdequatelyStaffed ? 'Optimal (A)' : 'Low (F)';

        // Smart hiring recommendations
        const suggestions = [];
        requiredRolesList.forEach(role => {
          const emp = employees.find(e => e.employeeType === role);
          const hired = emp ? emp.quantity : 0;
          const req = getRequiredStaffCount(startup?.businessType, role);
          if (hired < req) {
            suggestions.push({
              icon: 'fa-user-plus text-cyanGlow',
              text: `Hire ${req - hired} ${role}${req - hired > 1 ? 's' : ''} to optimize production efficiency.`
            });
          }
        });
        if (efficiencyPercent < 100) {
          suggestions.push({
            icon: 'fa-triangle-exclamation text-amber-400',
            text: 'Your production facility is currently understaffed.'
          });
        }

        return (
          <div className="flex flex-col gap-6 text-sm">
            {/* 1. Workforce Overview */}
            <div>
              <SectionHeader icon="fa-users" title="Workforce Overview" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Employees Hired" value={`${totalHired} / ${employeeCapacity}`} />
                <InfoCard label="Vacancies" value={`${availablePositions} Openings`} color="text-cyanGlow" />
                <InfoCard label="Monthly Payroll" value={formatCurrency(monthlyPayroll, startup?.country)} color="text-red-400" />
                <InfoCard label="Annual Payroll" value={formatCurrency(annualPayroll, startup?.country)} />
              </div>
            </div>

            {/* 2. Employee Categories & Hiring Center */}
            <div>
              <SectionHeader icon="fa-user-plus" title="Employee Categories & Recruiting" />
              <div className="flex flex-col gap-4">
                {employees.map((emp, idx) => {
                  const meta = ROLE_METADATA[emp.employeeType] || { icon: 'fa-user text-text-muted', description: emp.employeeType };
                  const reqCount = getRequiredStaffCount(startup?.businessType, emp.employeeType);
                  const isStaffed = emp.quantity >= reqCount;
                  
                  return (
                    <div key={idx} className="p-4 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded border border-white/10 bg-white/2 flex items-center justify-center text-sm shrink-0">
                            <i className={`fa-solid ${meta.icon}`}></i>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-extrabold text-xs uppercase text-white truncate">
                              {emp.employeeType}s
                            </h4>
                            <p className="text-[9px] text-text-secondary mt-0.5 font-mono">
                              Salary: {formatCurrency(emp.salary, startup?.country)}/month
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                            isStaffed 
                              ? 'text-greenGlow bg-green-950/20 border-greenGlow/25' 
                              : 'text-amber-400 bg-amber-950/20 border-amber-500/25'
                          }`}>
                            {emp.quantity} / {reqCount} Hired
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-text-secondary font-body leading-relaxed bg-white/2 px-2.5 py-1.5 rounded border border-white/5">
                        {meta.description}
                      </p>

                      {/* Hire / Fire Controls */}
                      {(() => {
                        const draftQty = hireDrafts[emp.employeeType] || 1;
                        return (
                          <div className="flex flex-col gap-2 border-t border-white/5 pt-2 mt-1">
                            <div className="flex items-center justify-between text-[10px] text-text-secondary">
                              <span>Current Hired: <strong className="text-white font-mono">{emp.quantity}</strong></span>
                              <span>Hiring Batch: <strong className="text-cyanGlow font-mono">{draftQty}</strong></span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              {/* Batch Selector */}
                              <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5">
                                <button
                                  onClick={() => setHireDrafts(prev => ({ ...prev, [emp.employeeType]: Math.max(1, (prev[emp.employeeType] || 1) - 1) }))}
                                  className="w-5 h-5 border border-cyanGlow/30 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyanGlow text-[10px] rounded flex items-center justify-center cursor-pointer"
                                  title="Decrease hire batch size"
                                >
                                  <i className="fa-solid fa-minus"></i>
                                </button>
                                <span className="w-6 text-center font-mono font-bold text-xs text-white">{draftQty}</span>
                                <button
                                  onClick={() => setHireDrafts(prev => ({ ...prev, [emp.employeeType]: (prev[emp.employeeType] || 1) + 1 }))}
                                  className="w-5 h-5 border border-cyanGlow/30 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyanGlow text-[10px] rounded flex items-center justify-center cursor-pointer"
                                  title="Increase hire batch size"
                                >
                                  <i className="fa-solid fa-plus"></i>
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    onHire(emp.employeeType, draftQty);
                                    // Reset draft quantity back to 1 after hiring
                                    setHireDrafts(prev => ({ ...prev, [emp.employeeType]: 1 }));
                                  }}
                                  className="px-2.5 py-1 bg-green-950/20 border border-green-500/25 hover:bg-green-900/30 text-greenGlow text-[10px] font-display uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <i className="fa-solid fa-user-plus text-[9px]"></i> Hire {draftQty}
                                </button>
                                <button
                                  onClick={() => onFire(emp.employeeType)}
                                  disabled={emp.quantity <= 0}
                                  className="px-2.5 py-1 bg-red-950/20 border border-red-500/25 hover:bg-red-900/30 text-red-400 text-[10px] font-display uppercase tracking-wider rounded transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                >
                                  <i className="fa-solid fa-user-minus text-[9px]"></i> Fire 1
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Staffing Requirements per Facility */}
            <div>
              <SectionHeader icon="fa-business-time" title="Facility Staffing Requirements" />
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-3 text-xs font-mono">
                <div className="text-[10px] font-display uppercase tracking-widest text-text-secondary pb-1 border-b border-white/5">
                  {startup?.businessType} (Plot 5)
                </div>
                {requiredRolesList.map((role, idx) => {
                  const emp = employees.find(e => e.employeeType === role);
                  const hired = emp ? emp.quantity : 0;
                  const req = getRequiredStaffCount(startup?.businessType, role);
                  const met = hired >= req;
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-text-secondary">{role}s</span>
                      <span className={met ? 'text-greenGlow font-bold' : 'text-amber-400 font-bold'}>
                        {met ? '✔' : '❌'} {hired} / {req}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
                  <span className="text-text-secondary">Operations Capacity</span>
                  <span className={`font-bold ${isAdequatelyStaffed ? 'text-greenGlow' : 'text-amber-400 animate-pulse'}`}>
                    Operating at {efficiencyPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Hiring Suggestions */}
            <div>
              <SectionHeader icon="fa-lightbulb" title="Intelligent Suggestions" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                {suggestions.length > 0 ? (
                  suggestions.map((sug, idx) => (
                    <AlertCard 
                      key={idx}
                      type={sug.text.includes('understaffed') ? 'warning' : 'info'}
                      icon={sug.icon.split(' ')[0]}
                      text={sug.text}
                    />
                  ))
                ) : (
                  <AlertCard 
                    type="success"
                    text="No workforce recommendations."
                  />
                )}
              </div>
            </div>

            {/* 5. Payroll Summary */}
            <div>
              <SectionHeader icon="fa-file-invoice-dollar" title="Payroll Distribution Summary" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Monthly Payroll" value={formatCurrency(monthlyPayroll, startup?.country)} color="text-red-400" />
                <InfoCard label="Annual Payroll" value={formatCurrency(annualPayroll, startup?.country)} />
                <InfoCard label="Highest Paid Role" value={highestPaidRole} />
                <InfoCard label="Average Salary" value={`${formatCurrency(averageSalary, startup?.country)}/mo`} />
                <InfoCard label="Payroll Distribution" value="Coming Soon" color="text-text-muted italic" />
              </div>
            </div>

            {/* 6. Workforce Efficiency Metrics */}
            <div>
              <SectionHeader icon="fa-chart-pie" title="Workforce Efficiency Metrics" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Current Efficiency" value={`${efficiencyPercent}%`} color={isAdequatelyStaffed ? 'text-greenGlow' : 'text-amber-400'} />
                <InfoCard label="Productivity Rating" value={efficiencyStatus} color={isAdequatelyStaffed ? 'text-greenGlow' : 'text-amber-400'} />
                <InfoCard label="Worker Satisfaction" value="Coming Soon" color="text-text-muted italic" />
                <InfoCard label="Idle Workforce" value="Coming Soon" color="text-text-muted italic" />
              </div>
            </div>

            {/* 7. Employee Activity Log */}
            <div>
              <SectionHeader icon="fa-history" title="Recent Workforce Activity" />
              <PlaceholderCard 
                title="No Activity" 
                description="No recent workforce activity." 
                icon="fa-history" 
              />
            </div>

            {/* 8. Future Workforce Modules */}
            <div>
              <SectionHeader icon="fa-graduation-cap" title="Future Workforce Modules" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Training & Development', desc: 'Raise employee expertise.' },
                  { name: 'Role Promotions', desc: 'Promote personnel tiers.' },
                  { name: 'HR Departments', desc: 'Organize corporate nodes.' },
                  { name: 'Wage Bonuses', desc: 'Increase retention rates.' },
                  { name: 'Performance Review', desc: 'Audit worker productivity.' },
                  { name: 'Labour Contracts', desc: 'Establish legal schedules.' }
                ].map((action, idx) => (
                  <FutureFeatureCard
                    key={idx}
                    title={action.name}
                    description={action.desc}
                  />
                ))}
              </div>
            </div>

          </div>
        );
      }

      case 'Marketplace':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-comments-dollar"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Logistics & Trade</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Open market trading lists, automated contract negotiation, shipping logs, and cross-border tariff charts are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      case 'Finance':
        return (
          <div className="flex flex-col items-center justify-center text-center h-[350px] gap-4">
            <div className="w-12 h-12 rounded-full border border-cyanGlow/30 bg-cyanGlow/10 flex items-center justify-center text-cyanGlow text-lg">
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest text-white">Treasury & Audits</h4>
              <p className="text-xs text-text-muted mt-2 max-w-[240px] leading-relaxed">
                Company ledger sheets, tax rates, corporate credit lines, and cash flow reports are scheduled for Phase B.
              </p>
            </div>
          </div>
        );

      case 'Profile': {
        const hasStartup = !!startup;
        const hiredCount = totalEmployees;
        const hasHired = hiredCount > 0;
        const hasTrades = transactions.some(t => t.transactionType === 'Sale' || t.transactionType === 'Purchase');
        const hasProduced = transactions.some(t => t.transactionType === 'Production' || t.transactionType === 'Produce') || Object.values(producingState || {}).length > 0;
        const hasProfit = netProfitLoss > 0;
        const millionProgress = Math.min(100, Math.round((currentCash / 1000000) * 100));

        // Derived career rank
        let careerRank = 'Novice Founder';
        if (startup?.level >= 3) careerRank = 'Venture Capitalist';
        else if (startup?.level >= 2) careerRank = 'Venture Specialist';

        // Achievements list
        const achievementsList = [
          { name: 'First Company Founded', desc: 'Construct your corporate headquarters.', unlocked: hasStartup, progress: hasStartup ? '100%' : '0%' },
          { name: 'First Employee Hired', desc: 'Recruit personnel to fill facility positions.', unlocked: hasHired, progress: hasHired ? '100%' : '0%' },
          { name: 'Global Trader', desc: 'Register a buy or sell transaction on the marketplace.', unlocked: hasTrades, progress: hasTrades ? '100%' : '0%' },
          { name: 'Production Specialist', desc: 'Manufacture commodities using raw materials.', unlocked: hasProduced, progress: hasProduced ? '100%' : '0%' },
          { name: 'First Profit', desc: 'Earn a positive operating margin.', unlocked: hasProfit, progress: hasProfit ? '100%' : '0%' },
          { name: 'First Million', desc: 'Accumulate cash reserves of €1.0M.', unlocked: currentCash >= 1000000, progress: `${millionProgress}%` },
          { name: 'Industrial Giant', desc: 'Construct 5 production facilities.', unlocked: false, progress: '20%' },
          { name: 'Board Director', desc: 'Incorporate cross-company portfolio networks.', unlocked: false, progress: '0%' }
        ];

        // Milestones chronological list
        const regDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Day 1';
        const timelineEvents = [
          { name: 'Founder Registration', desc: 'Joined CapitalGrid global sandbox.', date: regDate, icon: 'fa-user-check', completed: true },
          { name: 'First Startup Registered', desc: `${startup?.startupName || 'Startup'} incorporated.`, date: 'Day 1', icon: 'fa-building', completed: hasStartup }
        ];
        if (hasHired) {
          timelineEvents.push({ name: 'Workforce Assembled', desc: 'Hired first operating employee.', date: 'Day 1', icon: 'fa-user-plus', completed: true });
        }
        if (hasProduced) {
          timelineEvents.push({ name: 'First Batch Run', desc: 'Completed raw material processing.', date: 'Day 1', icon: 'fa-cubes', completed: true });
        }
        if (hasTrades) {
          timelineEvents.push({ name: 'First Ledger Trade', desc: 'Registered contract transaction on the market.', date: 'Day 1', icon: 'fa-shop', completed: true });
        }

        // Recent personal notifications
        const notificationsList = [
          { icon: 'fa-envelope text-cyanGlow', text: 'Welcome to the CapitalGrid Exchange terminal.' }
        ];
        if (hasStartup) {
          notificationsList.unshift({ icon: 'fa-building text-greenGlow', text: `${startup?.startupName} is active on Plot 5.` });
        }
        if (hasHired) {
          notificationsList.unshift({ icon: 'fa-users text-amber-500', text: `HR Payroll active: ${totalEmployees} workers hired.` });
        }

        return (
          <div className="flex flex-col gap-6 text-sm">
            {/* 1. Player Profile Header */}
            <div className="p-5 bg-white/2 border border-white/5 rounded-lg flex items-center gap-4 bg-gradient-to-b from-glassBg to-black/30 relative">
              <div className="absolute right-4 top-4 flex items-center gap-1.5 text-[8px] font-mono text-greenGlow uppercase tracking-widest bg-green-950/20 px-2 py-0.5 rounded border border-greenGlow/10">
                <span className="w-1 h-1 rounded-full bg-greenGlow animate-ping"></span>
                Online
              </div>
              <div className="w-16 h-16 rounded-full border border-cyanGlow/30 bg-cyanGlow/5 flex items-center justify-center text-cyanGlow text-2xl shrink-0 overflow-hidden relative">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-user-astronaut"></i>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-extrabold text-sm uppercase text-white truncate">
                  {user?.fullName || 'Founder'}
                </h3>
                <p className="text-[9px] text-text-secondary mt-0.5 font-mono truncate">
                  ID: {user?._id || 'founder-usr'}
                </p>
                <div className="flex flex-col gap-1 mt-2 font-mono text-[9px] text-text-secondary">
                  <div>Rank: <span className="text-cyanGlow font-bold">{careerRank}</span></div>
                  <div>Registered: <span className="text-white font-bold">{regDate}</span></div>
                  <div>Origin: <span className="text-white font-bold inline-flex items-center gap-1.5">{renderFlagImage(user?.country || startup?.country)} {user?.country || startup?.country || 'Global'}</span></div>
                </div>
              </div>
            </div>

            {/* Log Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full py-2 bg-red-950/20 border border-red-500/25 hover:bg-red-900/40 text-red-400 text-xs font-display uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                Log Out <i className="fa-solid fa-power-off text-[10px]"></i>
              </button>
            )}

            {/* 2. Career Overview Cards */}
            <div>
              <SectionHeader icon="fa-road" title="Career Progression Overview" />
              <div className="grid grid-cols-2 gap-3.5 font-mono text-xs">
                <StatCard label="Companies Owned" value="1 Corporation" icon="fa-building" />
                <StatCard label="Total Net Worth" value={formatCurrency(netWorth, startup?.country)} icon="fa-chart-pie" color="text-greenGlow" />
                <StatCard label="Career Revenue" value={formatCurrency(monthlyRevenue, startup?.country)} icon="fa-arrow-trend-up" />
                <StatCard label="Career Profit" value={formatCurrency(netProfitLoss, startup?.country)} icon="fa-scale-balanced" color={netProfitLoss >= 0 ? 'text-greenGlow' : 'text-red-400'} />
                <StatCard label="Total Hired Staff" value={`${totalEmployees} employees`} icon="fa-users" />
                <StatCard label="Facilities Owned" value="1 Facility" icon="fa-industry" color="text-cyanGlow" />
              </div>
            </div>

            {/* 3. Company Portfolio */}
            <div>
              <SectionHeader icon="fa-folder-open" title="Corporate Portfolio Holdings" />
              <div className="flex flex-col gap-2">
                {hasStartup ? (
                  <div 
                    onClick={() => setSelectedCompanyId(startup._id)}
                    className={`p-4 bg-black/35 border rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                      selectedCompanyId === startup._id 
                        ? 'border-cyanGlow bg-cyanGlow/5' 
                        : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 p-1.5 rounded bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                        {renderLogo(startup.logo)}
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-xs uppercase text-white truncate max-w-[130px]">
                          {startup.startupName}
                        </h4>
                        <p className="text-[9px] text-text-secondary mt-0.5 truncate max-w-[130px]">
                          {startup.businessType}
                        </p>
                        <p className="text-[9px] text-text-muted mt-0.5 font-mono flex items-center gap-1.5">
                          {renderFlagImage(startup.country)} {startup.country}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-cyanGlow">
                        {formatCurrency(companyValuation, startup.country)}
                      </div>
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-green-950/20 text-greenGlow border border-greenGlow/10 uppercase tracking-widest mt-1 block">
                        Operational
                      </span>
                    </div>
                  </div>
                ) : (
                  <PlaceholderCard 
                    title="No Portfolio Holdings" 
                    description="No active startup registered." 
                    icon="fa-folder-open" 
                  />
                )}
              </div>
            </div>

            {/* 4. Career Statistics */}
            <div>
              <SectionHeader icon="fa-chart-line" title="Founder Career Statistics" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Total Products Produced" value={`${transactions.filter(t => t.transactionType === 'Production').reduce((sum, t) => sum + t.quantity, 0)} units`} />
                <InfoCard label="Marketplace Trades" value={`${transactions.filter(t => t.transactionType === 'Sale' || t.transactionType === 'Purchase').length} operations`} />
                <InfoCard label="Employees Recruited" value={startup?.employeesRecruited || 0} />
                <InfoCard label="Employees Laid Off" value={startup?.employeesLaidOff || 0} />
                <InfoCard label="Facilities Erected" value="1" />
                <InfoCard label="Gross Revenue Earned" value={formatCurrency(monthlyRevenue, startup?.country)} color="text-greenGlow" />
                <InfoCard label="Gross Expenses Paid" value={`(${formatCurrency(monthlyExpenses, startup?.country)})`} color="text-red-400" />
                <InfoCard label="Career Play Days" value="1" />
                <InfoCard label="Total Play Sessions" value="1" />
              </div>
            </div>

            {/* 5. Achievements Panel */}
            <div>
              <SectionHeader icon="fa-trophy" title={`Career Achievements (${achievementsList.filter(a => a.unlocked).length} / ${achievementsList.length})`} />
              <div className="flex flex-col gap-2">
                {achievementsList.map((ach, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 bg-black/30 border rounded-lg flex items-center justify-between gap-3 ${
                      ach.unlocked 
                        ? 'border-cyanGlow/25 bg-cyanGlow/5' 
                        : 'border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                        ach.unlocked 
                          ? 'border-cyanGlow/30 bg-cyanGlow/10 text-cyanGlow' 
                          : 'border-white/10 bg-white/2 text-text-muted'
                      }`}>
                        <i className={`fa-solid ${ach.unlocked ? 'fa-award text-sm' : 'fa-lock text-[10px]'}`}></i>
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-[11px] uppercase text-white leading-normal">
                          {ach.name}
                        </h4>
                        <p className="text-[9px] text-text-secondary leading-normal mt-0.5">
                          {ach.desc}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-mono font-bold ${ach.unlocked ? 'text-greenGlow' : 'text-text-muted'}`}>
                        {ach.unlocked ? 'UNLOCKED' : ach.progress}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Milestones Timeline */}
            <div>
              <SectionHeader icon="fa-timeline" title="Career Timeline Milestones" />
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-4">
                {timelineEvents.map((ev, idx) => (
                  <TimelineCard 
                    key={idx}
                    title={ev.name}
                    description={ev.desc}
                    date={ev.date}
                    icon={ev.icon}
                    completed={ev.completed}
                  />
                ))}
              </div>
            </div>

            {/* 7. Player Reputation */}
            <div>
              <SectionHeader icon="fa-shield" title="Career Reputation Statistics" />
              <div className="flex flex-col gap-2 font-mono text-xs">
                <InfoCard label="Career Reputation" value="Level 1 Founder" />
                <InfoCard label="Global Rank Index" value="#482" color="text-cyanGlow" />
                <InfoCard label="Business Rating" value="A- Grade" color="text-greenGlow" />
                <InfoCard label="Contracts Reliability" value="98%" />
                <InfoCard label="Corporate Trust Score" value="99%" />
              </div>
            </div>

            {/* 8. Recent notifications */}
            <div>
              <SectionHeader icon="fa-envelope-open-text" title="Recent Career Alerts" />
              <div className="flex flex-col gap-2 text-xs font-mono">
                {notificationsList.map((notif, idx) => (
                  <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded flex items-center gap-3">
                    <i className={`fa-solid ${notif.icon} text-[10px]`}></i>
                    <span className="text-text-secondary">{notif.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 9. Career Settings Card */}
            <div>
              <SectionHeader icon="fa-sliders" title="Founder Configuration Panel" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Profile Settings', desc: 'Configure founder info.' },
                  { name: 'Select Avatar', desc: 'Upload custom board avatar.' },
                  { name: 'Privacy Nodes', desc: 'Establish lobby privacy.' },
                  { name: 'Language Toggles', desc: 'Select terminal display localization.' }
                ].map((action, idx) => (
                  <FutureFeatureCard
                    key={idx}
                    title={action.name}
                    description={action.desc}
                  />
                ))}
              </div>
            </div>

          </div>
        );
      }

      default:
        return null;
    }
  };

  // Determine header attributes
  const title = `${activeTab === 'Dashboard' ? 'Executive Dashboard' : activeTab} Panel`;
  const icon = 
    activeTab === 'Dashboard' ? 'fa-chart-pie' :
    activeTab === 'Company' ? 'fa-building' :
    activeTab === 'Employees' ? 'fa-users' :
    activeTab === 'Marketplace' ? 'fa-shop' :
    activeTab === 'Finance' ? 'fa-wallet' :
    'fa-user-astronaut';

  return (
    <DrawerWrapper isOpen={isOpen} onClose={onClose} title={title} icon={icon}>
      {renderContent()}
    </DrawerWrapper>
  );
}
