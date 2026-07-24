import { Activity, Brain, CalendarClock, ClipboardList, HeartPulse, MessageSquare, ShieldCheck, Sparkles, Stethoscope, Users } from 'lucide-react';
import { buildTodaySnapshot } from '@/lib/vida-fit';

const pillars = [
  {
    title: 'Paciente',
    description: 'Registro diário de alimentação, água, sono, exercícios e evolução.',
    icon: HeartPulse,
  },
  {
    title: 'Profissional',
    description: 'Agenda, acompanhamento, mensagens e alertas inteligentes para revisão.',
    icon: Stethoscope,
  },
  {
    title: 'Admin',
    description: 'Validação de profissionais, métricas, pagamentos e gestão operacional.',
    icon: ShieldCheck,
  },
];

const journeys = [
  'Login e onboarding seguro',
  'Escolha de especialidade e profissional',
  'Agendamento, pagamento e consulta online',
  'Acompanhamento diário com IA assistiva',
];

const VidaFit = () => {
  const snapshot = buildTodaySnapshot();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.22),_transparent_45%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] px-4 pb-24 pt-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
                <Sparkles className="h-4 w-4" />
                VidaFit.AI v2.0
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">Plataforma inteligente para cuidado contínuo</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Teleatendimento, nutrição, exercícios, alertas de risco e gestão completa do paciente em um único ambiente preparado para escalar.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-right">
              <p className="text-sm text-emerald-200">Risco atual</p>
              <p className="text-3xl font-semibold">{snapshot.score}</p>
              <p className="text-sm text-emerald-100">{snapshot.risk.level}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Painel do dia</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-sm text-slate-400">Meta de água</p>
                <p className="mt-1 text-xl font-semibold">1.800ml</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-sm text-slate-400">Refeições</p>
                <p className="mt-1 text-xl font-semibold">2/5</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-sm text-slate-400">Consulta</p>
                <p className="mt-1 text-xl font-semibold">14:00</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">IA assistiva</p>
              <p className="mt-2 text-sm text-slate-200">{snapshot.risk.description}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {snapshot.alerts.map((alert) => (
                  <li key={alert} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Agenda do paciente</h2>
            </div>
            <div className="space-y-3">
              {snapshot.schedule.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-slate-400">Agenda inteligente</p>
                  </div>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-200">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-cyan-500/10 p-2 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Fluxo principal</h2>
            </div>
            <div className="space-y-3">
              {journeys.map((step, idx) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl bg-white/5 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-200">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Ações prioritárias</h2>
            </div>
            <div className="space-y-3">
              {snapshot.actions.map((action) => (
                <div key={action} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <span className="text-sm text-slate-200">{action}</span>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">Pronto</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>O profissional pode solicitar atendimento urgente diretamente no app.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">Módulos cobertos</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              'Busca de profissionais',
              'Agenda e consultas',
              'Registro de alimentação e água',
              'Relatórios, notificações e IA assistiva',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default VidaFit;
