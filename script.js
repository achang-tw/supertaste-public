const SuperCoupon = {
	coupons: [],
	loaded: false,
	couponAPI: 'https://ads.achang.tw/super-coupon/index.php',
	selectorAPI: 'https://ads.achang.tw/super-coupon/selector-api.php',
	async init(){
		if(SuperCoupon.loaded){
			return;
		}
		if(document.body.classList.contains('home')){
			return;
		}

		try{
			await this.addBaseElement();
			await this.loadStyles();
			await this.loadCoupons();
			this.loadFont();
			this.loaded = true;
		}catch(e){
			console.error('loaded coupons failed!', e);
		}
	},
	async addBaseElement(){
        let target = null;
        let selectorsToTry = [];
        const fallbackSelectors = ['.post-entry h2', '.article-content h2', 'article h2', '.entry-content h2', '.single main h2'];
        
        // ***** 1. 設定預設的目標索引 *****
        let targetVisibleIndex = 2; // 後備用的預設值

        try {
            const response = await fetch(`${this.selectorAPI}?domain=${window.location.hostname}`);
            if (!response.ok) throw new Error('API response not OK');
            const data = await response.json();

            if (data.selector) {
                selectorsToTry.push(data.selector);
                // ***** 2. 從 API 回應中取得 visible_index *****
                // 確保它是大於 0 的數字，否則使用預設值 2
                if (data.visible_index && data.visible_index > 0) {
                    targetVisibleIndex = data.visible_index;
                }
            } else {
                selectorsToTry = fallbackSelectors;
            }
        } catch (error) {
            console.error('Failed to fetch selector from API, using fallback list.', error);
            selectorsToTry = fallbackSelectors;
        }

		for(const selector of selectorsToTry) {
			const elements = document.querySelectorAll(selector);
			if (elements.length === 0) continue;

			let visibleElementCount = 0;
			for(const el of elements) {
				if(el.checkVisibility()) {
					visibleElementCount++;
					// ***** 3. 使用動態的目標索引來比較 *****
					if (visibleElementCount === targetVisibleIndex) {
						target = el;
						break;
					}
				}
			}
			
            // 如果 API 指定找第 1 個，但上面的迴圈沒找到（例如只有1個元素），這裡補上
            if (!target && targetVisibleIndex === 1 && elements.length > 0 && elements[0].checkVisibility()) {
                target = elements[0];
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
		link.href = 'https://achang-tw.github.io/supertaste-public/style.min.css';
		document.head.appendChild(link);
	},
	pickCoupons(coupons, pickedAmount = 3){
		const pickedCoupons = [];
		while(pickedCoupons.length < pickedAmount && coupons.length > 0){
			const totalWeight = coupons.reduce((acc, coupon) => acc + Number(coupon.weight), 0);
			let randomNum = Math.random() * totalWeight;
			for(let i = 0; i < coupons.length; i++){
                let coupon = coupons[i];
				randomNum -= Number(coupon.weight);
				if (randomNum < 0) {
					pickedCoupons.push(coupon);
                    coupons.splice(i, 1);
					break;
				}
			}
		}
		return pickedCoupons;
	},
	async loadCoupons(){
		const storedData = JSON.parse(localStorage.getItem('superCoupons') || "{}");

		if(storedData && storedData.coupons && storedData.time && new Date().getTime() < storedData.time){
			// **** 1. 從快取讀取時，也要執行驗證 ****
			this.coupons = this.validCoupons(storedData.coupons);
			this.drawHTML();
		}else{
			fetch(this.couponAPI) // <--- 請將此處換成您實際的 PHP 檔案網址
				.then(res => res.json())
				.then(data => {
					// 將從後端拿到的原始資料存入快取
					localStorage.setItem('superCoupons', JSON.stringify({
						coupons: data,
						time: new Date().getTime() + 60 * 5 * 1000, // 快取 5 分鐘
					}));

					// **** 2. 處理剛獲取的資料時，也執行驗證 ****
					this.coupons = this.validCoupons(data);
					this.drawHTML();
				})
				.catch(error => console.error('Error fetching coupons:', error));
		}
	},

	// **** 3. 將驗證函式加回來 ****
	validCoupons(coupons){
		return coupons.filter(coupon => {
			const now = new Date();
			const start = this.stringToDate(coupon.start);
			const end = this.stringToDate(coupon.end);

			return now >= start && now <= end;
		});
	},
	stringToDate(dateString){
		if (!dateString) return new Date('1970-01-01'); // 處理空日期字串
		dateString = dateString.replace(/\//g, '-').replace(/\s+/g, ' ');
		const [datePart, timePart] = dateString.split(' ');
		const [year, month, day] = datePart.split('-').map(Number);
		// 如果沒有時間部分，預設為 00:00:00
		const [hours = 0, minutes = 0, seconds = 0] = (timePart || '0:0:0').split(':').map(Number);

		return new Date(year, month - 1, day, hours, minutes, seconds);
	},

	async drawHTML(){
		// **** 4. 在繪製前再次確認，確保資料是有效的 ****
		const validCoupons = this.validCoupons(this.coupons);

		if(validCoupons && validCoupons.length > 0){
			const pickedCoupons = this.pickCoupons([...validCoupons], 1);
			Array.from(document.querySelectorAll('.supertaste-coupon .coupon-list')).map(container => {
				container.innerHTML = pickedCoupons.map(coupon => {
					if(coupon.title_info){
						coupon.title_info = coupon.title_info.replace(/\n/g, '<br>');
					}
					// 以下的 HTML 產生邏輯完全不變
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
														<img class="location-icon" src="https://achang-tw.github.io/supertaste-public/location.svg" />
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
															<source srcset="https://achang-tw.github.io/supertaste-public/coupon-icon-mo.jpg" media="(max-width: 768px)">
															<img src="https://achang-tw.github.io/supertaste-public/coupon-icon-pc.jpg" alt="">
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
												<img src="https://achang-tw.github.io/supertaste-public/bg-pc.svg" alt="">
											</picture>
										</div>
									</div>
								</div>`;
							} else {
								// ... 此處省略未變更的 HTML ...
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