// ============================================================
// Landing Page - ColorVerse
// ============================================================
import { Link } from 'react-router-dom'
import { Zap, Shield, Trophy, TrendingUp, Users, Star, ArrowRight, Play, Gamepad2 } from 'lucide-react'

const COLORS = [
  { name: 'Red', color: 'bg-game-red', shadow: 'shadow-glow-red' },
  { name: 'Green', color: 'bg-game-green', shadow: 'shadow-glow-green' },
  { name: 'Blue', color: 'bg-game-blue' },
  { name: 'Purple', color: 'bg-game-purple', shadow: 'shadow-glow' },
  { name: 'Orange', color: 'bg-game-orange' },
  { name: 'Teal', color: 'bg-game-teal', shadow: 'shadow-glow-cyan' },
  { name: 'Pink', color: 'bg-game-pink' },
  { name: 'Yellow', color: 'bg-game-yellow' },
  { name: 'Coral', color: 'bg-game-coral' },
  { name: 'Lime', color: 'bg-game-lime' },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Game rounds resolve every 30 seconds with real-time results via Socket.io',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: Shield,
    title: 'Secure & Fair',
    desc: 'Advanced RNG with house edge algorithm ensures fairness for all players',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Trophy,
    title: 'Win Big',
    desc: 'Predict the right color and win 9x your bet amount instantly',
    color: 'text-brand-400',
    bg: 'bg-brand-400/10',
  },
  {
    icon: Users,
    title: 'Referral Rewards',
    desc: 'Earn ₹50 for every friend you refer who deposits. Unlimited referrals!',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
]

const STATS = [
  { label: 'Active Players', value: '50,000+' },
  { label: 'Games Played', value: '2M+' },
  { label: 'Total Paid Out', value: '₹5Cr+' },
  { label: 'Countries', value: '15+' },
]

const Landing = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-700/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl" />
        <div className="bg-grid absolute inset-0 opacity-20" />
      </div>

      {/* ============================================================
          Header
          ============================================================ */}
      <header className="relative z-10 border-b border-dark-300/30 bg-dark-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gaming-gradient flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl">
              Color<span className="text-gradient">Verse</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline text-sm py-2 px-4">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">
              Play Now
              <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          Hero Section
          ============================================================ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-600/30
          rounded-full px-4 py-2 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-fast" />
          Live Gaming Platform • Trusted by 50,000+ Players
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] mb-6 animate-slide-up">
          Predict.
          <br />
          <span className="text-gradient">Win.</span>
          <br />
          Repeat.
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          The most thrilling color prediction game on the internet.
          Pick a color, place your bet, and win <span className="text-brand-400 font-semibold">9x your bet</span> in under 30 seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/register" className="btn-primary text-lg py-4 px-8 shadow-glow flex items-center gap-2 justify-center">
            <Play className="w-5 h-5" />
            Start Playing Free
          </Link>
          <Link to="/leaderboard" className="btn-secondary text-lg py-4 px-8 flex items-center gap-2 justify-center">
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </Link>
        </div>

        {/* Color Showcase */}
        <div className="flex flex-wrap gap-3 justify-center">
          {COLORS.map((c, i) => (
            <div
              key={c.name}
              className={`w-12 h-12 rounded-full ${c.color} ${c.shadow || ''} cursor-pointer
                transition-all duration-300 hover:scale-125 hover:-translate-y-2 animate-float`}
              style={{ animationDelay: `${i * 0.1}s` }}
              title={c.name}
            />
          ))}
        </div>
      </section>

      {/* ============================================================
          Stats Section
          ============================================================ */}
      <section className="relative z-10 border-y border-dark-300/30 bg-dark-700/40 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <p className="text-3xl md:text-4xl font-display font-black text-gradient-gold">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          Features Section
          ============================================================ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold mb-4">
            Why Choose <span className="text-gradient">ColorVerse?</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Built with cutting-edge technology to give you the best gaming experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card p-6 space-y-4 hover:border-brand-600/30 transition-all
                duration-300 hover:-translate-y-1 hover:shadow-glow group"
            >
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-white font-semibold text-lg">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          Game Preview Section
          ============================================================ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="gradient-card p-8 md:p-12 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gaming-gradient opacity-5" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 badge badge-brand">
                <Gamepad2 className="w-3 h-3" />
                Color Prediction Game
              </div>
              <h2 className="text-4xl font-display font-bold">
                Simple. Fast. <span className="text-gradient">Exciting.</span>
              </h2>
              <div className="space-y-4 text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-400 text-xs font-bold mt-0.5">1</div>
                  <p>Choose your lucky color from 10 vibrant options</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-400 text-xs font-bold mt-0.5">2</div>
                  <p>Enter your bet amount (₹10 minimum)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-400 text-xs font-bold mt-0.5">3</div>
                  <p>Watch the 30-second countdown and real-time results</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold mt-0.5">✓</div>
                  <p className="text-emerald-400 font-medium">Win 9x your bet if your color is chosen!</p>
                </div>
              </div>
              <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                Play Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Color Grid Preview */}
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((c, i) => (
                <div
                  key={c.name}
                  className={`aspect-square rounded-xl ${c.color} opacity-80 hover:opacity-100
                    transition-all duration-200 hover:scale-110 cursor-pointer`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA Section
          ============================================================ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="glass-card p-10 md:p-16 border-gradient">
          <Star className="w-12 h-12 text-brand-400 mx-auto mb-6 animate-spin-slow" />
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to Win <span className="text-gradient">Big?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join 50,000+ players. Get ₹50 signup bonus when you refer a friend.
          </p>
          <Link to="/register" className="btn-primary text-lg py-4 px-10 shadow-glow">
            Create Free Account
          </Link>
          <p className="text-slate-500 text-xs mt-4">
            18+ only. Play responsibly. T&C apply.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-300/30 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="font-display font-bold text-white">ColorVerse</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2024 ColorVerse. All rights reserved. | Play Responsibly 🎮
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
