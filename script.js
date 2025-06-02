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
	getXPath(element) {
		if (element.id !== '') {
			return `//*[@id="${element.id}"]`;
		}
		if (element === document.body) {
			return '/html/body';
		}

		let ix = 0;
		const siblings = element.parentNode.childNodes;
		for (let i = 0; i < siblings.length; i++) {
			const sibling = siblings[i];
			if (sibling === element) {
				return `${this.getXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
			}
			if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
				ix++;
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
		}else{
			var xpath = this.getXPath('main');
			var target = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			target.prepend(await this.baseElement());
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
				const validCoupons = this.validCoupons(JSON.parse(data))
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
													<svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
														<circle cx="7.21398" cy="6.27818" r="5.91979" stroke="#68A7FF" stroke-width="0.647477"/>
														<path d="M6.77275 10.2238C6.59093 10.2238 6.45457 10.1773 6.36366 10.0844C6.27275 9.9914 6.22729 9.84376 6.22729 9.64143C6.22729 9.41723 6.2781 9.01805 6.3797 8.44388C6.48665 7.86971 6.6658 7.00573 6.91713 5.85192L6.56419 5.4418C6.69254 5.33791 6.83959 5.25588 7.00537 5.19573C7.17649 5.13011 7.33157 5.0973 7.47061 5.0973C7.63104 5.0973 7.74334 5.13285 7.80751 5.20393C7.87703 5.26955 7.91179 5.38439 7.91179 5.54843C7.91179 5.57578 7.89574 5.6578 7.86366 5.79451C7.83692 5.93121 7.80216 6.08432 7.75938 6.25384C7.59361 6.94831 7.45457 7.57716 7.34227 8.14039C7.23532 8.70362 7.18184 9.17936 7.18184 9.56761C7.18184 9.7754 7.22997 9.92031 7.32623 10.0023C7.14975 10.15 6.96526 10.2238 6.77275 10.2238ZM7.48665 4.4001C7.31553 4.4001 7.17917 4.35909 7.07756 4.27706C6.97596 4.18957 6.92516 4.07474 6.92516 3.93256C6.92516 3.8232 6.95457 3.72203 7.01339 3.62907C7.07756 3.53611 7.16312 3.46229 7.27008 3.40761C7.37703 3.34746 7.50002 3.31738 7.63906 3.31738C7.81553 3.31738 7.95189 3.36113 8.04815 3.44862C8.14975 3.53065 8.20056 3.64001 8.20056 3.77672C8.20056 3.9517 8.13371 4.09934 8.00002 4.21965C7.86633 4.33995 7.69521 4.4001 7.48665 4.4001Z" fill="#68A7FF"/>
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