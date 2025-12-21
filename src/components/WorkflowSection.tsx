import { Search, Palette, Code, Share2 } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: '幫你搵出熱門內容',
    description: '設定目標受眾同內容策略',
    label: '第一步',
  },
  {
    id: 2,
    icon: Palette,
    title: '設計 Design',
    description: 'AI智能生成視覺內容',
    label: '第二步',
  },
  {
    id: 3,
    icon: Code,
    title: '開發 Develop',
    description: '批量製作多平台素材',
    label: '第三步',
  },
  {
    id: 4,
    icon: Share2,
    title: '一鍵自動佈發多平台',
    subtitle: 'Auto Social Media',
    description: '一鍵發佈到所有平台',
    label: '第四步',
  },
];

const WorkflowSection = () => {
  return (
    <section className="py-24 bg-card overflow-hidden">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-primary font-medium mb-4 tracking-wider">工作流程 workflow</p>
          <h2 className="heading-display text-2xl sm:text-3xl lg:text-4xl max-w-4xl mx-auto">
            從洞察到執行，每一步都旨在將創意轉化為可擴展的系統。
            <span className="block text-muted-foreground text-lg sm:text-xl mt-3 font-normal">
              From insight to execution, each step is designed to turn ideas into scalable systems.
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50" />
          
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="workflow-step animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Step number */}
              <div className="text-primary text-sm font-medium mb-4">
                {step.label}
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 relative z-10 border border-primary/20">
                <step.icon className="w-7 h-7 text-primary" />
                {/* Dot on the line */}
                <div className="hidden lg:block absolute -top-[2px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" style={{ top: '-26px' }} />
              </div>

              {/* Content */}
              <h3 className="heading-display text-lg font-bold mb-2 text-foreground">
                {step.title}
              </h3>
              {step.subtitle && (
                <p className="text-primary text-sm mb-2">{step.subtitle}</p>
              )}
              <p className="text-muted-foreground text-sm">
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
