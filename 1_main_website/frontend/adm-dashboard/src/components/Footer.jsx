import { Link } from 'react-router-dom';
import Icon, { icons } from './Icon';

const FOOTER_LINKS = [
    { label: 'Guidelines', to: '/guidelines' },
    { label: 'Email Us', href: 'mailto:support@adm-analytics.com' },
];

export default function Footer() {
    return (
        <footer className="bg-[#15263C] text-white border-t-[3px] border-[#f97316] py-[80px] px-[40px]">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                {/* Left: Branding */}
                <div>
                    <div className="mb-2 text-2xl font-bold tracking-widest uppercase">
                        ADM ANALYTICS
                    </div>
                    <p className="text-gray-400 text-[14px] tracking-widest uppercase">
                        © 2026 Strategy & Innovation Portal
                    </p>
                </div>

                {/* Right: Links */}
                <div className="flex items-center gap-10">
                    {FOOTER_LINKS.map((link) =>
                        link.to ? (
                            <Link
                                key={link.label}
                                to={link.to}
                                className="text-[15px] font-semibold text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-[15px] font-semibold text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                {link.label}
                            </a>
                        )
                    )}
                </div>
            </div>
        </footer>
    );
}
