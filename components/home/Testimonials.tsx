import { Star, UserCircle } from 'lucide-react';

const testimonials = [
  {
    quote: "For Your Health gave me the clarity I needed. The personalized plan was easy to follow and made a real difference in my energy levels.",
    name: 'Sarah L.',
    role: 'Busy Professional',
    avatar: '/images/avatars/sarah-l.jpg',
    rating: 5,
  },
  {
    quote: "I was skeptical at first, but the science-backed insights were eye-opening. I finally understand my body better.",
    name: 'Michael B.',
    role: 'Fitness Enthusiast',
    avatar: '/images/avatars/michael-b.jpg',
    rating: 5,
  },
  {
    quote: "The AI analysis is incredible. It connected dots I never would have on my own. Highly recommend!",
    name: 'Dr. Emily Carter',
    role: 'Wellness Advocate',
    avatar: '/images/avatars/emily-c.jpg',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-neutral-50 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 font-montserrat">
            Trusted by People Like You
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            Hear what our users are saying about their journey with For Your Health.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col"
            >
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-neutral-700 italic mb-6 flex-grow">
                <p className='relative'>
                  <span className='absolute -left-4 -top-2 text-5xl text-primary/30 font-serif'>“</span>
                  {testimonial.quote}
                  <span className='absolute -right-0 -bottom-4 text-5xl text-primary/30 font-serif'>”</span>
                </p>
              </blockquote>
              <div className="flex items-center mt-auto">
                {testimonial.avatar ? (
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <UserCircle size={48} className="text-neutral-400 mr-4" />
                )}
                <div>
                  <p className="font-semibold text-neutral-800 font-montserrat">{testimonial.name}</p>
                  <p className="text-sm text-neutral-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
