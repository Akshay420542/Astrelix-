# SCIENTIFIC & ORBITAL MECHANICS ENGINE
## Mathematical Formulation & Physical Foundations

### 1. Two-Body Gravitational Dynamics
The standard unperturbed equations of motion in an Earth-Centered Inertial (ECI) frame:
$$\ddot{\mathbf{r}} = -\frac{\mu}{r^3} \mathbf{r}$$
Where:
- $\mu = G M_{\oplus} = 3.986004418 \times 10^{14} \text{ m}^3/\text{s}^2$ (Earth gravitational parameter)
- $r = \|\mathbf{r}\|$ (Instantaneous distance from Earth center of mass)

### 2. Keplerian Orbital Elements
A state vector $(\mathbf{r}, \mathbf{v})$ maps uniquely to 6 classical Keplerian elements:
- $a$: Semi-major axis ($m$ or $km$)
- $e$: Eccentricity ($0 \le e < 1$ for bound elliptical orbits)
- $i$: Inclination with respect to equatorial plane ($rad$ or $deg$)
- $\Omega$: Right Ascension of the Ascending Node (RAAN)
- $\omega$: Argument of Periapsis
- $\nu$ or $\theta$: True Anomaly (angular position along orbit from periapsis)

Specific Orbital Energy:
$$\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}$$

Specific Angular Momentum:
$$\mathbf{h} = \mathbf{r} \times \mathbf{v}, \quad h = \|\mathbf{h}\| = \sqrt{\mu a (1 - e^2)}$$

Orbital Period:
$$T = 2\pi \sqrt{\frac{a^3}{\mu}}$$

Vis-Viva Equation:
$$v = \sqrt{\mu \left( \frac{2}{r} - \frac{1}{a} \right)}$$

### 3. Numerical Integration (Runge-Kutta 4th Order)
For state $\mathbf{y} = [\mathbf{r}, \mathbf{v}]^T$, the system is $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$:
$$\mathbf{k}_1 = \mathbf{f}(t_n, \mathbf{y}_n)$$
$$\mathbf{k}_2 = \mathbf{f}\left(t_n + \frac{\Delta t}{2}, \mathbf{y}_n + \frac{\Delta t}{2}\mathbf{k}_1\right)$$
$$\mathbf{k}_3 = \mathbf{f}\left(t_n + \frac{\Delta t}{2}, \mathbf{y}_n + \frac{\Delta t}{2}\mathbf{k}_2\right)$$
$$\mathbf{k}_4 = \mathbf{f}(t_n + \Delta t, \mathbf{y}_n + \Delta t \, \mathbf{k}_3)$$
$$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{\Delta t}{6} (\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$

### 4. Earth Oblateness ($J_2$ Perturbation)
Accounting for Earth's equatorial bulge:
$$J_2 = 1.08263 \times 10^{-3}, \quad R_{\oplus} = 6378137.0 \text{ m}$$
$$\mathbf{a}_{J_2} = -\frac{3}{2} J_2 \left(\frac{\mu}{r^2}\right) \left(\frac{R_{\oplus}}{r}\right)^2 \begin{bmatrix}
\frac{x}{r} \left(1 - 5 \frac{z^2}{r^2}\right) \\
\frac{y}{r} \left(1 - 5 \frac{z^2}{r^2}\right) \\
\frac{z}{r} \left(3 - 5 \frac{z^2}{r^2}\right)
\end{bmatrix}$$

This produces secular nodal regression ($\dot{\Omega}$) and apsidal precession ($\dot{\omega}$):
$$\dot{\Omega} \approx -\frac{3}{2} J_2 \left(\frac{R_{\oplus}}{p}\right)^2 n \cos(i)$$
$$\dot{\omega} \approx \frac{3}{4} J_2 \left(\frac{R_{\oplus}}{p}\right)^2 n (5 \cos^2(i) - 1)$$

### 5. Atmospheric Drag
For low Earth orbit ($h < 1000\text{ km}$):
$$\mathbf{a}_{\text{drag}} = -\frac{1}{2} \rho v_{\text{rel}} \mathbf{v}_{\text{rel}} \left(\frac{C_d A}{m}\right)$$
Where density $\rho(h) = \rho_0 \exp\left(-\frac{h - h_0}{H}\right)$ using scale heights $H$.

### 6. Hohmann Transfer & Maneuver Mechanics
For circular coplanar orbits $r_1$ and $r_2$:
Transfer orbit semi-major axis:
$$a_t = \frac{r_1 + r_2}{2}$$
Burn 1 (at periapsis):
$$\Delta v_1 = \sqrt{\frac{\mu}{r_1}} \left( \sqrt{\frac{2 r_2}{r_1 + r_2}} - 1 \right)$$
Burn 2 (at apoapsis):
$$\Delta v_2 = \sqrt{\frac{\mu}{r_2}} \left( 1 - \sqrt{\frac{2 r_1}{r_1 + r_2}} \right)$$
$$\Delta v_{\text{total}} = |\Delta v_1| + |\Delta v_2|$$
Transfer duration:
$$t_{\text{transfer}} = \pi \sqrt{\frac{a_t^3}{\mu}}$$

Propellant mass consumption (Tsiolkovsky equation):
$$\Delta m = m_0 \left( 1 - \exp\left(-\frac{\Delta v}{I_{\text{sp}} g_0}\right) \right)$$
Where $g_0 = 9.80665 \text{ m/s}^2$.
