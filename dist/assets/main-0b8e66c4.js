import"./style-bd45dd7d.js";import"./main-095d3270.js";import{g as s}from"./projectsData-b8c9ba37.js";async function i(){const e=document.getElementById("home-projects-grid");if(e)try{const o=(await s()).slice(0,12);e.innerHTML=o.map((t,r)=>`
                    <div class="min-w-[300px] md:min-w-[400px] snap-start group relative rounded-2xl overflow-hidden glass aspect-video" data-aos="fade-up" data-aos-delay="${r*50}">
                        <img src="${t.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${t.title}" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <div class="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <span class="text-[9px] font-bold text-industrial-yellow uppercase tracking-[0.3em] mb-2 block">${t.meta}</span>
                            <h3 class="text-xl font-display font-bold text-white uppercase tracking-tighter mb-1">${t.title}</h3>
                            <p class="text-gray-400 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">${t.description}</p>
                        </div>
                    </div>
                `).join("")}catch(a){console.error("Failed to load home projects:",a),e.innerHTML='<p class="text-gray-500 uppercase tracking-widest text-xs text-center w-full">Error loading items</p>'}}document.addEventListener("DOMContentLoaded",i);
