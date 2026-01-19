
import React from 'react';
import { Doctor, StyleConfig } from '../types';
import { Phone, Stethoscope } from 'lucide-react';

interface DoctorsSectionProps {
  doctors: Doctor[];
  style?: StyleConfig;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ doctors, style }) => {
  if (!doctors || doctors.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Bizning Jamoa</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Malakali Shifokorlarimiz
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map(doctor => (
                <div 
                    key={doctor.id} 
                    className="bg-white dark:bg-slate-950 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-slate-800">
                        {doctor.imageUrl ? (
                            <img 
                                src={`data:image/png;base64,${doctor.imageUrl}`} 
                                alt={doctor.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Stethoscope className="h-16 w-16 opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="text-xl font-bold">{doctor.name}</h3>
                            <p className="text-sm opacity-90 text-primary font-medium">{doctor.specialty}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                        
                        {/* Services List */}
                        <div className="flex-1 space-y-3 mb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Xizmatlar:</p>
                            {doctor.services && doctor.services.length > 0 ? (
                                doctor.services.map((service, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{service.name}</span>
                                        <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{service.price}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">Xizmatlar kiritilmagan</p>
                            )}
                        </div>

                        {/* Call Button */}
                        <a 
                            href={`tel:${doctor.phone.replace(/\s+/g, '')}`}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-primary/20 bg-primary hover:bg-sky-600"
                            style={{ borderRadius: style?.buttonRadius ? `${style.buttonRadius}px` : undefined }}
                        >
                            <Phone className="h-4 w-4" />
                            <span>Bog'lanish</span>
                        </a>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};
