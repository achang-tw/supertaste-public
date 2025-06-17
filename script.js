const SuperCoupon = {
	coupons: [],
	loaded: false,
	async init(){
		if(!SuperCoupon.loaded){
			if(document.body.classList.contains('home')){
				return;
			}
			// await new Promise(resolve => setTimeout(resolve, 1000));

			try{
				await this.addBaseElement();
				await this.loadStyles();
				await this.loadCoupons();
				this.loadFont();
				this.loaded = true;
			}catch(e){
				console.error('loaded coupons failed!', e);
			}
		}
	},
	async addBaseElement(){
		const targets = ['.post-entry h2', 'article h2', '.entry-content h2'];
		var target = null;

		var visibleElementCount = 0;
		for(let i = 0; i < targets.length; i++){
			const elements = document.querySelectorAll(targets[i]);
			visibleElementCount = 0;
			for(const el of elements) {
				if(el.checkVisibility()) {
					target = el;
					visibleElementCount++;
					if (visibleElementCount === 2) {
						target = el;
						break;
					}
				}
			}
			if(target) break;
		}
		if(target){
			target.before(await this.baseElement());
		}
	},
	async baseElement() {
		const base = document.createElement('div');
		base.classList.add('supertaste-coupon', 'splide', 'loading');
		base.innerHTML = `
		<div class="splide__track">
			<div class="collapse-icon" onclick="SuperCoupon.collapse()">
				<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12.42 0.451988L13.48 1.51299L7.70298 7.29199C7.61041 7.38514 7.50034 7.45907 7.37909 7.50952C7.25784 7.55997 7.12781 7.58594 6.99648 7.58594C6.86515 7.58594 6.73512 7.55997 6.61387 7.50952C6.49262 7.45907 6.38255 7.38514 6.28998 7.29199L0.50998 1.51299L1.56998 0.452987L6.99498 5.87699L12.42 0.451988Z" fill="#8A8A8A"/>
				</svg>
			</div>

			<div class="coupon-list splide__list"></div>
		</div>`;
		return base;
	},
	
	async loadStyles(){
		var link = document.createElement('link');

		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = 'https://linsly-achang.github.io/supertaste-public/style.css';

		document.head.appendChild(link);
	},
	pickCoupons(coupons, pickedAmount = 3){
		const pickedCoupons = [];

		// randomly pick coupons by weight
		while(pickedCoupons.length < pickedAmount){
			const totalWeight = coupons.reduce((acc, coupon) => acc + Number(coupon.weight), 0);
			let randomNum = Math.random() * totalWeight;

			for(let coupon of coupons){
				randomNum -= Number(coupon.weight);
				if (randomNum < 0) {
					pickedCoupons.push(coupon);
					break;
				}
			}
		}

		return pickedCoupons;
	},
	async loadCoupons(){
		const coupons = JSON.parse(localStorage.getItem('superCoupons')||"{}");

		if(coupons && coupons.coupons && coupons.coupons.length > 0 && coupons.time && new Date().getTime() < coupons.time){
			this.coupons = this.validCoupons(coupons.coupons);
			this.drawHTML();
		}else{
			fetch('https://ads.achang.tw/super-coupon/index.php').then(res => res.json()).then(data => {
				const validCoupons = this.validCoupons(data)
				this.coupons = validCoupons;
				localStorage.setItem('superCoupons', JSON.stringify({
					coupons: validCoupons,
					time: new Date().getTime() + 60 * 5 * 1000,
				})
				);
				this.drawHTML();
			});
		}
	},
	validCoupons(coupons){
		return coupons.filter(coupon => {
			const now = new Date();
			const start = this.stringToDate(coupon.start);
			const end = this.stringToDate(coupon.end);

			return now >= start && now <= end;
		});
	},
	stringToDate(dateString){
		dateString = dateString.replace(/\//g, '-').replace(/\s+/g, ' ');
		const [datePart, timePart] = dateString.split(' ');
		const [year, month, day] = datePart.split('-').map(Number);
		const [hours, minutes, seconds] = timePart.split(':').map(Number);

		return new Date(year, month - 1, day, hours, minutes, seconds);
	},
	async drawHTML(){
		const validCoupons = this.validCoupons(this.coupons);
		if(validCoupons.length > 0){
			Array.from(document.querySelectorAll('.supertaste-coupon .coupon-list')).map(container => {
				container.innerHTML = this.pickCoupons(validCoupons, 1).map(coupon => {
					if(coupon.title_info){
						coupon.title_info = coupon.title_info.replace(/\n/g, '<br>');
					}
					switch(coupon.type){
						case 'HTML畫版':
							if(coupon.image) {
								coupon = `<div class="coupon-item splide__slide">
									<div class="coupon-item-container">
										<div class="coupon-item-wrap">
											<div class="coupon-item-img-wrap">
												<div class="coupon-item-img" style="background-image:url(${coupon.image})"></div>
											</div>
											<div class="coupon-item-content">
												<div class="coupon-item-content-wrap">
													<div class="coupon-item-title">${coupon.title}</div>
													<div class="coupon-item-info">
														<img class="location-icon" src="https://linsly-achang.github.io/supertaste-public/location.svg" />
														<span>${coupon.title_info}</span>
													</div>
													<div class="cta-title">${coupon.cta_title}</div>` +
													(coupon.info_link ? `<div class="coupon-item-info-link"><a href="${coupon.info_link}" target="_blank">看店家報導</a></div>` : '') +
												`</div>
											</div>
											<div class="coupon-item-cta">
												<div class="cta-wrap">
													<div class="coupon-item-logo">
														<picture>
															<source srcset="https://linsly-achang.github.io/supertaste-public/coupon-icon-mo.jpg" media="(max-width: 768px)">
															<img src="https://linsly-achang.github.io/supertaste-public/coupon-icon-pc.jpg" alt="">
														</picture>
													</div>
													<div class="cta-title">${coupon.cta_title}</div>
													<div class="cta-btn"><a href="${coupon.link}" target="_blank">${coupon.cta_btn}</a></div>
												</div>
											</div>
											<div class="coupon-item-ext">
												<a href="https://supertaste.tvbs.com.tw/offers" target="_blank">
													<svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
														<circle cx="5.00004" cy="4.49998" r="3.99998" stroke="#68A7FF" stroke-width="0.399998"/>
														<path d="M4.616 6.51842V3.55698H5.19782V6.51842H4.616ZM4.90691 3.07989C4.80994 3.07989 4.72655 3.04498 4.65673 2.97516C4.58691 2.90147 4.552 2.81613 4.552 2.71917C4.552 2.61832 4.58691 2.53492 4.65673 2.46898C4.72655 2.39917 4.80994 2.36426 4.90691 2.36426C5.00776 2.36426 5.09309 2.39917 5.16291 2.46898C5.23273 2.53492 5.26763 2.61832 5.26763 2.71917C5.26763 2.81613 5.23273 2.90147 5.16291 2.97516C5.09309 3.04498 5.00776 3.07989 4.90691 3.07989Z" fill="#68A7FF"/>
													</svg>
												</a>
											</div>
										</div>
										<div class="coupon-item-bg">
											<picture>
												<img src="https://linsly-achang.github.io/supertaste-public/bg-pc.svg" alt="">
											</picture>
										</div>
									</div>
								</div>`;
							}else{
								coupon = `<div class="coupon-item splide__slide">
									<div class="coupon-item-container">
										<div class="coupon-item-wrap no-img">
											<div class="coupon-item-content">
												<div class="coupon-item-content-wrap">
													<div class="coupon-item-title"><a href="${coupon.link}" target="_blank">${coupon.title}</a></div>
													<div>${coupon.title_info}</div>
													<div><a href="${coupon.info_link}" target="_blank">查看店家資訊</a></div>
												</div>
											</div>
										</div>
										<div class="coupon-item-bg">
											<picture>
												<img src="https://linsly-achang.github.io/supertaste-public/bg-pc.svg" alt="">
											</picture>
										</div>
									</div>
								</div>`;
							}
							break;
						case '全圖模式':
							coupon = `<div class="coupon-item splide__slide">
								<div class="coupon-item-wrap">
									<div><a href="${coupon.link}" target="_blank"><img src="${coupon.image}" alt="${coupon.title}"></a></div>
								</div>
							</div>`;
							break;
					}

					return coupon;
				}).join('');
			});
			document.querySelector('.supertaste-coupon').classList.remove('loading');
		}
	},
	loadFont(){
		if(!window.WebFont){
			const webfont = document.createElement('script');
			webfont.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
			document.body.appendChild(webfont);

			webfont.onload = async () => {
				WebFont.load({
					google: {
						families: ['Noto Sans TC:400,500,700']
					}
				});
			}
		}else{
			WebFont.load({
				google: {
					families: ['Noto Sans TC:400,500,700']
				}
			});
		}
	},
	collapse(){
		const coupon = document.querySelector('.supertaste-coupon');
		coupon.classList.toggle('collapsed');
	}
};

window.onload = () => {
	SuperCoupon.init();
}

document.addEventListener('scroll', () => {
	SuperCoupon.init();
}, { once: true });

document.addEventListener('pointermove', () => {
	SuperCoupon.init();
}, { once: true });