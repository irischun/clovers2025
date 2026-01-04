import { Search, Palette, Code, Share2, Workflow } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: '幫你搵出熱門內容',
    description: '設定目標受眾同內容策略',
    label: '第一步',
    labelEn: 'Discover',
  },
  {
    id: 2,
    icon: Palette,
    title: '設計 Design',
    description: 'AI智能生成視覺內容',
    label: '第二步',
    labelEn: 'Design',
  },
  {
    id: 3,
    icon: Code,
    title: '開發 Develop',
    description: '批量製作多平台素材',
    label: '第三步',
    labelEn: 'Develop',
  },
  {
    id: 4,
    icon: Share2,
    title: '一鍵自動佈發多平台',
    subtitle: 'Auto Social Media',
    description: '一鍵發佈到所有平台',
    label: '第四步',
    labelEn: 'Deploy',
  },
];

const WorkflowSection = () => {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-seedling/5 blur-3xl -translate-y-1/2" />
      
      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="badge-nature mb-6 inline-flex">
            <Workflow className="w-4 h-4" />
            <span>Workflow</span>
          </div>
          
          <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl max-w-4xl mx-auto mb-6">
            從洞察到執行，每一步都旨在將創意轉化為可擴展的系統。
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            From insight to execution, each step is designed to turn ideas into scalable systems.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-20 left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/40 via-seedling/30 to-primary/40" />
          
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="workflow-step animate-slide-up group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Step label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-primary text-sm font-semibold tracking-wide">{step.label}</span>
                <span className="text-muted-foreground/60 text-xs">/ {step.labelEn}</span>
              </div>
              
              {/* Icon container */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-seedling/5 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-500">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Dot on the connection line */}
                <div 
                  className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/30" 
                  style={{ top: '-32px' }} 
                />
              </div>

              {/* Content */}
              <h3 className="font-heading text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                {step.title}
              </h3>
              {step.subtitle && (
                <p className="text-primary/80 text-sm mb-2 font-medium">{step.subtitle}</p>
              )}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;