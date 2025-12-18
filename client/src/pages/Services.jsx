import { Utensils, Wifi, Car, ConciergeBell, Dumbbell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services = () => {
    const services = [
        {
            icon: <Utensils className="w-8 h-8 text-primary-600" />,
            title: 'Fine Dining',
            description: 'Experience culinary excellence at our Michelin-starred restaurants offering diverse cuisines from around the globe.',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        },
        {
            icon: <Sparkles className="w-8 h-8 text-primary-600" />,
            title: 'Luxury Spa',
            description: 'Rejuvenate your senses with our premium spa treatments, designed to provide ultimate relaxation and wellness.',
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        },
        {
            icon: <Car className="w-8 h-8 text-primary-600" />,
            title: 'Chauffeur Service',
            description: 'Travel in style with our premium fleet of luxury vehicles and professional chauffeurs available 24/7.',
            image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        },
        {
            icon: <ConciergeBell className="w-8 h-8 text-primary-600" />,
            title: '24/7 Concierge',
            description: 'Our dedicated concierge team is at your service round-the-clock to fulfill your every request.',
            image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        },
        {
            icon: <Dumbbell className="w-8 h-8 text-primary-600" />,
            title: 'Fitness Center',
            description: 'Stay fit with our state-of-the-art gym equipment and personal training sessions.',
            image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        },
        {
            icon: <Wifi className="w-8 h-8 text-primary-600" />,
            title: 'High-Speed Wi-Fi',
            description: 'Stay connected with complimentary high-speed internet access throughout the hotel.',
            image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-primary-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                        alt="Hotel Services"
                        className="w-full h-full object-cover opacity-20"
                    />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
                        World-Class Amenities
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-primary-200">
                        Indulge in a premium experience with our comprehensive range of services designed for your comfort and luxury.
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="aspect-w-16 aspect-h-9 h-64 overflow-hidden">
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
                                        {service.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{service.title}</h3>
                                </div>
                                <p className="text-slate-200 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-slate-50 py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Request a Service?</h2>
                    <p className="text-slate-600 mb-8">
                        Already a guest? Log in to your dashboard to request any of these services directly from your room.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        Login to Request
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Services;
