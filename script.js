const SuperCoupon = {
	coupons: [],
	async init(){
		await new Promise(resolve => setTimeout(resolve, 1000));

		try{
			await this.addBaseElement();
			await this.loadStyles();
			await this.loadCoupons();
			await this.drawHTML();
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
		let coupons = localStorage.getItem('superCoupons');
		if(coupons){
			this.coupons = this.validCoupons(JSON.parse(coupons));
		}else{
			fetch('https://ads.achang.tw/super-coupon/index.php').then(res => res.json()).then(data => {
				this.coupons = this.validCoupons(JSON.parse(data));
				localStorage.setItem('superCoupons', JSON.stringify(this.coupons));
			});
		}
	},
	validCoupons(coupons){
		return coupons.filter(coupon => {
			const now = new Date();
			const start = new Date(coupon.start);
			const end = new Date(coupon.end);

			return now >= start && now <= end;
		});
	},
	async drawHTML(){
		Array.from(document.querySelectorAll('.supertaste-coupon .coupon-list')).map(container => {
			container.innerHTML = this.pickCoupons(this.coupons, 1).map(coupon => {
				if(coupon.title_info){
					coupon.title_info = coupon.title_info.replace(/\n/g, '<br>');
				}
				switch(coupon.type){
					case 'HTML畫版':
						if(coupon.image) {
							coupon = `<div class="coupon-item splide__slide">
								<div class="coupon-item-container">
									<div class="coupon-item-wrap">
										<div class="coupon-item-left">
											<div class="coupon-item-img-wrap">
												<div class="coupon-item-img" style="background-image:url(${coupon.image})"></div>
											</div>
											<div class="coupon-item-content">
												<div class="coupon-item-content-wrap">
													<div class="coupon-item-logo">
														<picture>
															<source srcset="https://linsly-achang.github.io/supertaste-public/coupon-icon-mo.jpg" media="(max-width: 768px)">
															<img src="https://linsly-achang.github.io/supertaste-public/coupon-icon-pc.jpg" alt="">
														</picture>
													</div>
													<div class="coupon-item-title">${coupon.title}</div>
													<div class="coupon-item-info">${coupon.title_info}</div>` +
													(coupon.info_link ? `<div class="coupon-item-info-link"><a href="${coupon.info_link}" target="_blank">查看店家資訊</a></div>` : '') +
												`</div>
											</div>
										</div>
										<div class="coupon-item-cta">
											<div class="cta-wrap">
												<div class="cta-title">${coupon.cta_title}</div>
												<div class="cta-info">${coupon.cta_info}</div>
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
