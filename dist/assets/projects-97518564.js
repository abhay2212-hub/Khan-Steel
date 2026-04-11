import"./style-c3994442.js";import"./main-694aeeb6.js";import{g as o}from"./projectsData-5e4ae3fb.js";const s=async()=>{const e=document.getElementById("projects-grid");if(!e)return;const a=await o();e.innerHTML=a.map((t,r)=>`
                <div class="group spotlight-card overflow-hidden rounded-2xl border border-white border-opacity-5" data-glow data-aos="fade-up" data-aos-delay="${r%4*100}">
                    <div class="aspect-video relative overflow-hidden">
                        <img src="${t.image}" alt="${t.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div class="p-5">
                        <h3 class="text-xl font-bold mb-2 uppercase">${t.title}</h3>
                        <p class="text-xs text-gray-500 uppercase tracking-widest mb-4">${t.meta}</p>
                        <p class="text-gray-400 text-sm mb-6">${t.description}</p>
                        <a href="contact.html" class="text-white text-xs font-bold tracking-widest flex items-center gap-2">INQUIRE <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `).join(""),setTimeout(()=>{AOS.refresh()},100)};document.addEventListener("DOMContentLoaded",s);
