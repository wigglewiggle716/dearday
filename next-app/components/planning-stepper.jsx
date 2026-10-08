import { planningSteps } from "../lib/planning-flow";

export default function PlanningStepper({locale="ar",current="plan"}) {
  const active=planningSteps.findIndex(s=>s.id===current);
  return <nav className="dd-planning-stepper" aria-label={locale==="ar"?"رحلة ترتيب المناسبة":"Occasion planning journey"}>
    <div className="dd-planning-stepper-rail">
      {planningSteps.map((step,index)=><div key={step.id}
        className={"dd-planning-step"+(index===active?" is-current":index<active?" is-past":"")}
        aria-current={index===active?"step":undefined}>
        <span className="dd-planning-step-marker">{index<active?"✓":index+1}</span>
        <span className="dd-planning-step-label">{step[locale]}</span>
      </div>)}
    </div>
  </nav>;
}
