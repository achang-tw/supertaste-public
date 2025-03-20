const SuperCoupon = {
	coupons: [],
	async init(){
		if(document.body.classList.contains('home')){
			return;
		}
		await new Promise(resolve => setTimeout(resolve, 1000));

		try{
			await this.addBaseElement();
			await this.loadStyles();
			await this.loadCoupons();
			this.loadFont();
		}catch(e){
			console.error('loaded coupons failed!', e);
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
		const targets = ['article p:not([class*="meta"])', '.entry-content p', 'header', 'h1'];
		var target = null;
		for(let i = 0; i < targets.length; i++){
			if(document.querySelector(targets[i])){
				target = targets[i];
				break;
			}
		}
		if(target){
			var targetElement = document.querySelector(target);
			var xpath = this.getXPath(targetElement);
	
			var element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			element.after(await this.baseElement());
		}else{
			var xpath = this.getXPath('main');
			var element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			element.prepend(await this.baseElement());
		}
	},
	async baseElement() {
		const base = document.createElement('div');
		base.classList.add('supertaste-coupon', 'splide');
		base.innerHTML = `
		<div class="splide__track">
			<svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g clip-path="url(#clip0_61_54)">
				<path d="M17.42 2.45199L18.48 3.51299L12.703 9.29199C12.6104 9.38514 12.5004 9.45907 12.3791 9.50952C12.2579 9.55997 12.1278 9.58594 11.9965 9.58594C11.8652 9.58594 11.7352 9.55997 11.6139 9.50952C11.4927 9.45907 11.3826 9.38514 11.29 9.29199L5.51001 3.51299L6.57001 2.45299L11.995 7.87699L17.42 2.45199Z" fill="#8A8A8A"/>
				</g>
				<defs>
				<clipPath id="clip0_61_54">
				<rect width="12" height="24" fill="white" transform="translate(24) rotate(90)"/>
				</clipPath>
				</defs>
			</svg>

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

		if(coupons && coupons.coupons && coupons.time && new Date().getTime() < coupons.time){
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
			const start = new Date(coupon.start.replace(/\//g, '-'));
			const end = new Date(coupon.end.replace(/\//g, '-'));

			return now >= start && now <= end;
		});
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
	}
};
