import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Cable,
  Check,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Users,
  Workflow
} from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' }
];

const features = [
  {
    icon: Users,
    title: 'Quan ly khach hang',
    description: 'Tap trung lead, lich su cham soc va trang thai chuyen doi trong mot timeline ro rang.'
  },
  {
    icon: Activity,
    title: 'Pipeline realtime',
    description: 'Theo doi dieu chuyen deal theo tung stage ngay khi team cap nhat tren he thong.'
  },
  {
    icon: BarChart3,
    title: 'Bao cao & thong ke',
    description: 'Dashboard doanh thu, conversion rate va KPI ban hang theo thoi gian thuc.'
  },
  {
    icon: Lock,
    title: 'Phan quyen user',
    description: 'Role-based access cho Admin, Sales va tung bo phan voi session control an toan.'
  },
  {
    icon: Cable,
    title: 'Tich hop API',
    description: 'Ket noi he thong ngoai qua API endpoint de dong bo du lieu nhanh va on dinh.'
  },
  {
    icon: Bot,
    title: 'Automation',
    description: 'Tu dong hoa nhac viec, cap nhat trang thai va trigger thong bao cho team phu trach.'
  }
];

const pricingPlans = [
  {
    name: 'Free',
    price: '0',
    period: '/thang',
    description: 'Danh cho nhom nho muon bat dau nhanh',
    features: ['Toi da 3 thanh vien', '500 contacts', 'Dashboard co ban'],
    cta: 'Dung thu mien phi',
    highlight: false
  },
  {
    name: 'Pro',
    price: '399K',
    period: '/thang',
    description: 'Toi uu cho team sales dang tang truong',
    features: ['Khong gioi han user', 'Automation nang cao', 'Bao cao chi tiet + API'],
    cta: 'Bat dau voi Pro',
    highlight: true
  },
  {
    name: 'Enterprise',
    price: 'Lien he',
    period: '',
    description: 'Giai phap cho doanh nghiep quy mo lon',
    features: ['SSO + RBAC tuy bien', 'Dedicated support', 'SLA 99.9% uptime'],
    cta: 'Nhan bao gia',
    highlight: false
  }
];

const testimonials = [
  {
    quote:
      'CRM Mini giup team toi rut ngan hon 30% thoi gian follow-up khach hang. UI de dung va phan tich rat ro rang.',
    name: 'Minh Chau',
    role: 'Head of Sales, Nova Labs',
    avatar: 'https://i.pravatar.cc/80?img=47'
  },
  {
    quote:
      'Truoc day chung toi dung 3 cong cu roi rac, gio tat ca tap trung ve mot dashboard duy nhat. Qua tien cho quy trinh.',
    name: 'Hoang Nam',
    role: 'Founder, OrbitOps',
    avatar: 'https://i.pravatar.cc/80?img=57'
  },
  {
    quote:
      'Phan quyen va audit session giup bo phan admin yen tam hon khi mo rong team va onboarding nhan su moi.',
    name: 'Linh Tran',
    role: 'Operations Manager, BlueYard',
    avatar: 'https://i.pravatar.cc/80?img=32'
  }
];

const quickStats = [
  { label: 'Users', value: '1000+' },
  { label: 'Deals', value: '5000+' },
  { label: 'Uptime', value: '99.9%' }
];

const previewHighlights = [
  {
    title: 'Revenue Overview',
    description: 'Theo doi doanh thu theo thang va bien dong tung giai doan.'
  },
  {
    title: 'Live Pipeline',
    description: 'Nhin thay ngay deal nao dang tac, deal nao can day nhanh.'
  },
  {
    title: 'Team Activity',
    description: 'Nhat ky hoat dong theo user de quan ly tien do va chat luong cham soc.'
  }
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(80rem_45rem_at_20%_-10%,rgba(45,212,191,0.16),transparent),radial-gradient(65rem_36rem_at_90%_0%,rgba(56,189,248,0.18),transparent),linear-gradient(180deg,#fcfdff_0%,#f8fbff_100%)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">CRM Mini</span>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
              Login
            </Link>
            <Link
              to="/login?mode=register"
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              Modern CRM for growing teams
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[56px]">
              Tang toc quy trinh ban hang
              <span className="mt-1 block bg-gradient-to-r from-cyan-700 via-sky-600 to-blue-700 bg-clip-text text-transparent">
                va cham soc khach hang
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              CRM Mini giup team ban hang theo doi pipeline, customer health va doanh thu tren mot giao dien tinh gon nhu mot SaaS product thuc thu.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/login?mode=register"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Bat dau mien phi
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#preview"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-500 hover:text-cyan-700"
              >
                Xem demo
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {['No credit card required', 'Deploy nhanh trong 1 ngay', 'Mo rong theo quy mo team'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  <Check className="h-3.5 w-3.5 text-cyan-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div id="about" className="relative animate-fade-up-delayed">
            <div className="animate-float relative">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=860&q=80"
                alt="CRM Dashboard"
                className="w-full rounded-[28px] border border-slate-200/90 object-cover shadow-[0_28px_70px_-32px_rgba(15,23,42,0.4)]"
              />
              {/* Bottom-left stat card */}
              <div className="absolute -bottom-4 -left-4 rounded-2xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                <p className="text-[11px] font-medium text-slate-500">Doanh thu thang nay</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">3.2B VNĐ</p>
                <p className="text-xs font-semibold text-emerald-600">↑ 24.1% so thang truoc</p>
              </div>
              {/* Top-right stat card */}
              <div className="absolute -right-4 -top-4 rounded-2xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                <p className="text-[11px] font-medium text-slate-500">Open deals</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">421</p>
                <span className="mt-1 inline-block rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">Realtime</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <p className="text-center text-sm font-medium text-slate-500">Duoc tin dung boi 100+ teams san xuat va startup</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            {[
              { name: 'Nova Labs', bg: 'from-violet-500 to-purple-600', letter: 'N' },
              { name: 'NordicScale', bg: 'from-sky-500 to-blue-600', letter: 'NS' },
              { name: 'BlueYard', bg: 'from-cyan-500 to-teal-600', letter: 'BY' },
              { name: 'OrbitOps', bg: 'from-orange-500 to-amber-500', letter: 'O' },
              { name: 'Acme Digital', bg: 'from-rose-500 to-pink-600', letter: 'AD' },
            ].map((logo) => (
              <div key={logo.name} className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${logo.bg} text-[11px] font-bold text-white`}>
                  {logo.letter}
                </div>
                <span className="text-sm font-semibold text-slate-600">{logo.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mt-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tat ca nhung gi team sales can trong mot he thong</h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-25px_rgba(15,23,42,0.4)]"
              >
                <div className="inline-flex rounded-xl bg-cyan-50 p-2 text-cyan-700 transition group-hover:bg-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="preview" className="mt-20 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_26px_60px_-34px_rgba(15,23,42,0.35)]">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
              alt="Analytics Dashboard"
              className="h-72 w-full object-cover lg:h-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">CRM Dashboard Preview</span>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">Pro</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[{ label: 'Revenue', value: '4.8B' }, { label: 'Win rate', value: '63%' }, { label: 'New leads', value: '129' }].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                    <p className="text-[11px] text-white/70">{stat.label}</p>
                    <p className="mt-0.5 text-base font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Dashboard Preview</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Theo doi toan canh he thong CRM trong vai giay</h3>
            <div className="mt-5 space-y-3">
              {previewHighlights.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {quickStats.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500">{item.label}</p>
            </article>
          ))}
        </section>

        <section id="pricing" className="mt-20">
          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Goi dich vu phu hop voi tung giai doan tang truong</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-3xl border p-6 shadow-sm transition ${
                  plan.highlight
                    ? 'relative border-cyan-300 bg-gradient-to-b from-cyan-50 to-white shadow-[0_24px_52px_-30px_rgba(8,145,178,0.45)]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Most popular</span>
                )}
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                <p className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900">
                  {plan.price}
                  <span className="text-base font-medium text-slate-500">{plan.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-cyan-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=register"
                  className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                    plan.highlight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Testimonials</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Khach hang noi gi ve CRM Mini</h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm leading-6 text-slate-600">"{item.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                  {index === 0 && <MessageCircle className="ml-auto h-4 w-4 text-cyan-600" />}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-white shadow-[0_24px_50px_-28px_rgba(15,23,42,0.8)] sm:px-8">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Ready to scale</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight">San sang nang cap quy trinh ban hang cua ban?</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Khoi tao workspace trong vai phut va dua toan bo team vao mot flow CRM thong nhat, minh bach va de van hanh.
              </p>
            </div>
            <Link
              to="/login?mode=register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Bat dau ngay
              <CircleDollarSign className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-200/80 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-base font-semibold text-slate-900">CRM Mini</p>
            <p className="mt-1 text-sm text-slate-500">Built for modern sales teams - clean, fast, and scalable.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
            <a href="#features" className="transition hover:text-slate-900">Features</a>
            <a href="#pricing" className="transition hover:text-slate-900">Pricing</a>
            <a href="#about" className="transition hover:text-slate-900">About</a>
            <a href="#contact" className="transition hover:text-slate-900">Contact</a>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} CRM Mini. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
