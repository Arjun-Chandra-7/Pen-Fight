// Last Bench League physics core.
// This is intentionally platform-neutral C++17: compile it with Emscripten for
// the browser, or include it in a native client/server simulation.
#include <algorithm>
#include <cmath>

namespace lastbench {
struct Vec2 { float x{}, y{}; Vec2 operator+(Vec2 b)const{return{x+b.x,y+b.y};} Vec2 operator-(Vec2 b)const{return{x-b.x,y-b.y};} Vec2 operator*(float s)const{return{x*s,y*s};} };
static float dot(Vec2 a,Vec2 b){return a.x*b.x+a.y*b.y;} static float length(Vec2 a){return std::sqrt(dot(a,a));}
struct Pen { Vec2 position, velocity; float angle{}, angularVelocity{}; float mass{1.f}, grip{.974f}, radius{18.f}; float power{1.f}, balance{}, spin{1.f}; bool alive{true}; };
struct Desk { float left{}, top{}, right{}, bottom{}; float outset{34.f}; };

class World {
 public:
  Desk desk; Pen player, rival;
  // Use a fixed step (1/120s in the host) so the same input produces the same shot.
  void step(float dt) {
    integrate(player,dt); integrate(rival,dt); collide();
  }
  void flick(Pen& pen, Vec2 impulse, float spin) {
    pen.velocity = pen.velocity + impulse*(1.f/pen.mass); pen.angularVelocity += spin;
  }
 private:
  void integrate(Pen& p,float dt) {
    if(!p.alive) return;
    p.position=p.position+p.velocity*dt;
    p.angle+=p.angularVelocity*dt;
    // Friction is frame-rate independent; torque gives visible barrel roll.
    float decay=std::pow(p.grip,dt*60.f); p.velocity=p.velocity*decay; p.angularVelocity*=std::pow(.975f,dt*60.f);
    if(p.position.x<desk.left-desk.outset||p.position.x>desk.right+desk.outset||p.position.y<desk.top-desk.outset||p.position.y>desk.bottom+desk.outset)p.alive=false;
  }
  void collide() {
    if(!player.alive||!rival.alive) return;
    Vec2 delta=rival.position-player.position;
    float d=length(delta), min=player.radius+rival.radius;
    if(d<=0||d>=min) return;
    Vec2 n=delta*(1.f/d);
    float overlap=(min-d)*.5f;
    player.position=player.position-n*overlap;
    rival.position=rival.position+n*overlap;
    float normalSpeed=dot(rival.velocity-player.velocity,n); if(normalSpeed>0)return;
    float impulse=-.38f*normalSpeed/(1.f/player.mass+1.f/rival.mass);
    player.velocity=player.velocity-n*(impulse/player.mass); rival.velocity=rival.velocity+n*(impulse/rival.mass);
    player.angularVelocity+=impulse*.005f; rival.angularVelocity-=impulse*.005f;
  }
};
} // namespace lastbench
