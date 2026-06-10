import"./style-bd45dd7d.js";import"./main-095d3270.js";import{g as o}from"./projectsData-b8c9ba37.js";async function i(){const e=document.getElementById("services-products-grid");if(e)try{const s=(await o()).filter(t=>t.meta==="Design Collection").slice(0,18);e.innerHTML=s.map((t,r)=>`
                    <div class="group relative rounded-2xl overflow-hidden glass aspect-video" data-aos="fade-up" data-aos-delay="${r*30}">
                        <img src="${t.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="${t.title}" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                        <div class="absolute bottom-0 left-0 p-6">
                            <h4 class="text-sm font-bold text-white uppercase tracking-widest">${t.title}</h4>
                            <p class="text-[9px] text-gray-500 uppercase tracking-widest">${t.description}</p>
                        </div>
                    </div>
                `).join("")}catch(a){console.error("Failed to load products:",a),e.innerHTML='<p class="text-gray-500 uppercase tracking-widest text-xs">System sync error</p>'}}document.addEventListener("DOMContentLoaded",i);
