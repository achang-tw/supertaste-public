const SuperCoupon = {
	coupons: [
		{
			"title": "金田屋大福飲品買一送一",
			"txt": "金田屋大福飲品買一送一，限定活動，快來搶購！",
			"date": "02/24 開始",
			"href": "https://supertaste.tvbs.com.tw/food/353033"
		},
		{
			"title": "金田屋大福飲品，限定日期買一送一",
			"txt": "金田屋大福飲品，買一送一，限定日期，不要錯過！",
			"date": "02/24 開始",
			"href": "https://supertaste.tvbs.com.tw/food/353033",
			"img": "https://linsly-achang.github.io/supertaste-public/IMG_3888.jpg"
		},
		{
			"cover": "https://linsly-achang.github.io/supertaste-public/%E5%84%AA%E6%83%A0%E5%88%B8_0212.png",
			"title": "金田屋大福飲品，限定日期買一送一",
			"href": "https://supertaste.tvbs.com.tw/food/353033"
		}
	],
	async init(){
		await new Promise(resolve => setTimeout(resolve, 1000));

		try{
			await this.addBaseElement();
			await this.loadStyles();
			await this.loadCoupons();
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
		const targets = ['header', 'h1'];
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
		base.style.height = '105px';
		base.style.overflow = 'hidden';
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
	async loadCoupons(){
		fetch('https://ads.achang.tw/super-coupon/index.php').then(res => res.json()).then(data => {
			const fetchData = JSON.parse(data);
			console.log(fetchData)
		});
		const promises = Array.from(document.querySelectorAll('.supertaste-coupon .coupon-list')).map(container => {
			return new Promise(resolve => {
				container.innerHTML = this.coupons.map(coupon => {
					if(coupon.cover) {
						return `<div class="coupon-item splide__slide">
							<div class="coupon-item-wrap">
								<div><a href="${coupon.href}" target="_blank"><img src="${coupon.cover}" alt="${coupon.title}"></a></div>
							</div>
						</div>`
					} else if(coupon.img) {
						coupon = `<div class="coupon-item splide__slide">
							<div class="coupon-item-wrap">
								<div class="coupon-item-img" style="background-image:url(${coupon.img})"></div>
								<div class="coupon-item-content">
									<div><a href="${coupon.href}" target="_blank">${coupon.title}</a></div>
									<div>${coupon.txt}</div>
									<div>${coupon.date}</div>
								</div>
							</div>
						</div>`;
					}else{
						coupon = `<div class="coupon-item splide__slide">
							<div class="coupon-item-wrap no-img">
								<div class="coupon-item-content">
									<div><a href="${coupon.href}" target="_blank">${coupon.title}</a></div>
									<div>${coupon.txt}</div>
									<div>${coupon.date}</div>
								</div>
							</div>
						</div>`;
					}

					return coupon;
				}).join('');
				resolve();
			});
		});

		Promise.all(promises).then(() => {
			if(!window.Splide) {
				const script = document.createElement('script');
				script.src = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js';
				document.body.appendChild(script);

				const style = document.createElement('link');
				style.rel = 'stylesheet';
				style.href = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css';
				document.head.appendChild(style);

				script.onload = async () => {
					await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒，确保脚本加载完成

					new Splide('.supertaste-coupon', {
						type: 'loop',
						autoplay: true,
						interval: 3000,
						pagination: false,
						arrows: false,
						perPage: 1,
						height: 105,
						gap: 16,
					}).mount();
				}
			}
		});
	}
};
