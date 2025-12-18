import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Clock } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="bg-slate-50">
            {/* Hero Section */}
            <div className="relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        className="w-full h-full object-cover opacity-40"
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        alt="Hotel Lobby"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40" />
                </div>

                <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
                    <div className="md:w-2/3">
                        <div className="inline-flex items-center rounded-full bg-primary-500/10 px-3 py-1 text-sm font-medium text-primary-400 ring-1 ring-inset ring-primary-500/20 mb-6">
                            ✨ Experience Luxury
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
                            Welcome to the future of <br />
                            <span className="text-secondary-500">Hotel Management</span>
                        </h1>
                        <p className="mt-6 text-xl text-slate-300 max-w-3xl">
                            Seamless bookings, personalized services, and effortless stays. Experience the perfect blend of comfort and technology.
                        </p>
                        <div className="mt-10 flex gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                            >
                                Get Started
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link
                                to="/rooms"
                                className="inline-flex items-center px-6 py-3 border border-slate-500 text-base font-medium rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
                            >
                                View Rooms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Why Choose Us</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            A better way to stay
                        </p>
                    </div>

                    <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: <Star className="h-8 w-8 text-white" />,
                                title: 'Premium Experience',
                                desc: 'Five-star service at your fingertips. Request anything, anytime.'
                            },
                            {
                                icon: <Shield className="h-8 w-8 text-white" />,
                                title: 'Secure Booking',
                                desc: 'Your data and payments are protected with enterprise-grade security.'
                            },
                            {
                                icon: <Clock className="h-8 w-8 text-white" />,
                                title: '24/7 Support',
                                desc: 'Our staff is always available to ensure your stay is perfect.'
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="relative group p-6 bg-slate-50 rounded-2xl hover:bg-primary-50 transition-colors">
                                <div className="absolute -top-6 left-6 inline-flex rounded-xl bg-primary-600 p-3 shadow-lg group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="mt-8 text-xl font-medium text-slate-900 tracking-tight">{feature.title}</h3>
                                <p className="mt-5 text-base text-slate-500">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
