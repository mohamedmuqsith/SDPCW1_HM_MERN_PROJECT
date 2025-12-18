import { Phone, Mail, MapPin, Send, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock submission
        alert('Message sent! We will get back to you shortly.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-slate-900 py-16 text-center text-white">
                <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-slate-300 max-w-2xl mx-auto px-4">
                    Have questions or need assistance? Our 24/7 support team is here to help ensure your stay is perfect.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900">Get in Touch</h2>

                        <div className="flex items-start space-x-4">
                            <div className="bg-primary-100 p-3 rounded-lg text-primary-600">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Phone</h3>
                                <p className="text-slate-600 mt-1">+1 (555) 123-4567</p>
                                <p className="text-slate-500 text-sm">24/7 Customer Support</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-primary-100 p-3 rounded-lg text-primary-600">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Email</h3>
                                <p className="text-slate-600 mt-1">support@luxestay.com</p>
                                <p className="text-slate-600">bookings@luxestay.com</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-primary-100 p-3 rounded-lg text-primary-600">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Location</h3>
                                <p className="text-slate-600 mt-1">
                                    123 Luxury Blvd,<br />
                                    Beverly Hills, CA 90210<br />
                                    United States
                                </p>
                            </div>
                        </div>

                        {/* FAQ Preview */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2 text-primary-500" />
                                Review FAQ
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Find quick answers to common questions about booking, cancellation, and amenities.
                            </p>
                            <button className="text-primary-600 text-sm font-medium hover:text-primary-700 hover:underline">
                                Visit Help Center &rarr;
                            </button>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        id="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Booking Inquiry"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        id="message"
                                        rows={6}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-300 focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                    >
                                        Send Message
                                        <Send className="ml-2 h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
